import { NextResponse } from "next/server";
import crypto from "crypto";
import { activateSubscription, cancelSubscription } from "@/lib/billing";
import { dispatchWebhook } from "@/lib/webhooks";
import { prisma } from "@/lib/prisma";

/**
 * Dlocal webhook handler.
 * Docs: https://docs.dlocal.com/reference/webhook-notifications
 */
export async function POST(req: Request) {
  const DLOCAL_SECRET = process.env.DLOCAL_SECRET;
  if (!DLOCAL_SECRET) {
    return NextResponse.json({ error: "Dlocal not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  const expectedSig = crypto
    .createHmac("sha256", DLOCAL_SECRET)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.type) {
      case "PAYMENT": {
        if (event.status !== "PAID") break;

        const { organizationId, planId } = event.metadata ?? {};
        if (!organizationId || !planId) break;

        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) break;

        await activateSubscription(organizationId, plan.id, {
          provider: "DLOCAL",
          providerSubId: event.id,
          amount: Number(event.amount),
          currency: event.currency,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        });

        dispatchWebhook(organizationId, "subscription.created", {
          provider: "DLOCAL",
          planSlug: plan.slug,
          providerPaymentId: event.id,
        });
        break;
      }

      case "SUBSCRIPTION_CANCELLED": {
        const { organizationId } = event.metadata ?? {};
        if (!organizationId) break;
        await cancelSubscription(organizationId);
        dispatchWebhook(organizationId, "subscription.canceled", { provider: "DLOCAL", event: event.id });
        break;
      }
    }
  } catch (err) {
    console.error("[dlocal webhook]", event.type, err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
