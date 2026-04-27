import { NextResponse } from "next/server";
import crypto from "crypto";
import { activateSubscription, cancelSubscription, markPastDue } from "@/lib/billing";
import { dispatchWebhook } from "@/lib/webhooks";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionActivatedEmail, sendSubscriptionCanceledEmail, sendPaymentFailedEmail } from "@/lib/email";

/**
 * Paddle webhook handler.
 * Docs: https://developer.paddle.com/webhooks/overview
 * Eventos que manejamos: subscription.activated, subscription.canceled,
 * subscription.payment_failed, transaction.completed
 */
export async function POST(req: Request) {
  const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
  if (!PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Paddle not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";

  // Verificar firma Paddle
  const [tsEntry, h1Entry] = signature.split(";");
  const ts = tsEntry?.split("=")[1];
  const h1 = h1Entry?.split("=")[1];
  const expectedSig = crypto
    .createHmac("sha256", PADDLE_WEBHOOK_SECRET)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  if (h1 !== expectedSig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const { event_type, data } = event;

  try {
    switch (event_type) {
      case "subscription.activated":
      case "transaction.completed": {
        const customData = data.custom_data ?? {};
        const { organizationId, planSlug } = customData;
        if (!organizationId) break;

        const plan = await prisma.plan.findFirst({ where: { slug: planSlug } });
        if (!plan) break;

        await activateSubscription(organizationId, plan.id, {
          provider: "PADDLE",
          providerSubId: data.id,
          amount: Number(data.items?.[0]?.price?.unit_price?.amount ?? 0) / 100,
          currency: data.currency_code ?? "USD",
          currentPeriodStart: new Date(data.billing_period?.starts_at ?? Date.now()),
          currentPeriodEnd: new Date(data.billing_period?.ends_at ?? Date.now() + 30 * 86400000),
        });

        dispatchWebhook(organizationId, "subscription.created", {
          provider: "PADDLE",
          planSlug,
          providerSubId: data.id,
        });
        const paddleOwner = await prisma.user.findFirst({
          where: { organizationId, role: "OWNER" },
          select: { email: true, name: true },
        });
        const paddleOrg = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        });
        if (paddleOwner && paddleOrg && plan) {
          await sendSubscriptionActivatedEmail({
            toEmail: paddleOwner.email,
            toName: paddleOwner.name ?? paddleOwner.email,
            orgName: paddleOrg.name,
            planName: plan.name,
            amount: Number(data.items?.[0]?.price?.unit_price?.amount ?? 0) / 100,
            nextPaymentAt: new Date(data.billing_period?.ends_at ?? Date.now() + 30 * 86400000),
          });
        }
        break;
      }

      case "subscription.canceled": {
        const customData = data.custom_data ?? {};
        const { organizationId } = customData;
        if (!organizationId) break;
        await cancelSubscription(organizationId);
        dispatchWebhook(organizationId, "subscription.canceled", { provider: "PADDLE", providerSubId: data.id });
        const canceledOwner = await prisma.user.findFirst({
          where: { organizationId, role: "OWNER" },
          select: { email: true, name: true },
        });
        const canceledOrg = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        });
        if (canceledOwner && canceledOrg) {
          await sendSubscriptionCanceledEmail({
            toEmail: canceledOwner.email,
            toName: canceledOwner.name ?? canceledOwner.email,
            orgName: canceledOrg.name,
            accessUntil: new Date(data.scheduled_change?.effective_at ?? Date.now() + 30 * 86400000),
          });
        }
        break;
      }

      case "subscription.payment_failed": {
        const customData = data.custom_data ?? {};
        const { organizationId } = customData;
        if (!organizationId) break;
        await markPastDue(organizationId);
        const failedOwner = await prisma.user.findFirst({
          where: { organizationId, role: "OWNER" },
          select: { email: true, name: true },
        });
        const failedOrg = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true, plan: { select: { name: true } } },
        });
        if (failedOwner && failedOrg?.plan) {
          await sendPaymentFailedEmail({
            toEmail: failedOwner.email,
            toName: failedOwner.name ?? failedOwner.email,
            orgName: failedOrg.name,
            planName: failedOrg.plan.name,
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[paddle webhook]", event_type, err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
