/**
 * Helpers para integración de pagos.
 * Paddle: para mercados internacionales (tarjeta, PayPal).
 * Dlocal: para LATAM (transferencias locales, PIX, PSE, etc.).
 */

import { prisma } from "./prisma";

// ─── Helpers de suscripción ───────────────────────────────────────────────────

export async function activateSubscription(
  organizationId: string,
  planId: string,
  opts: {
    provider: "DLOCAL" | "PADDLE" | "MANUAL";
    providerSubId?: string;
    amount: number;
    currency: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }
) {
  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: { subscriptionStatus: "ACTIVE", planId },
    }),
    prisma.subscription.updateMany({
      where: { organizationId, status: { in: ["TRIAL", "PAST_DUE"] } },
      data: {
        status: "ACTIVE",
        planId,
        provider: opts.provider,
        providerSubId: opts.providerSubId,
        amount: opts.amount,
        currency: opts.currency,
        currentPeriodStart: opts.currentPeriodStart,
        currentPeriodEnd: opts.currentPeriodEnd,
        lastPaymentAt: new Date(),
        nextPaymentAt: opts.currentPeriodEnd,
      },
    }),
  ]);
}

export async function cancelSubscription(organizationId: string) {
  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: { subscriptionStatus: "CANCELED" },
    }),
    prisma.subscription.updateMany({
      where: { organizationId, status: "ACTIVE" },
      data: { status: "CANCELED", canceledAt: new Date() },
    }),
  ]);
}

export async function markPastDue(organizationId: string) {
  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: { subscriptionStatus: "PAST_DUE" },
    }),
    prisma.subscription.updateMany({
      where: { organizationId, status: "ACTIVE" },
      data: { status: "PAST_DUE" },
    }),
  ]);
}

// ─── Paddle ───────────────────────────────────────────────────────────────────

export function buildPaddleCheckoutUrl(opts: {
  planSlug: string;
  paddlePriceId: string;
  orgEmail: string;
  orgId: string;
  couponCode?: string;
}): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({
    items: JSON.stringify([{ priceId: opts.paddlePriceId, quantity: 1 }]),
    customer_email: opts.orgEmail,
    custom_data: JSON.stringify({ organizationId: opts.orgId, planSlug: opts.planSlug }),
    success_url: `${base}/billing/success?provider=paddle`,
    ...(opts.couponCode ? { discount_code: opts.couponCode } : {}),
  });
  return `https://buy.paddle.com/checkout?${params.toString()}`;
}

// ─── Dlocal ───────────────────────────────────────────────────────────────────

export async function createDlocalPaymentIntent(opts: {
  planId: string;
  amount: number;
  currency: string;
  country: string; // AR, BR, MX, CO, CL, PE, UY
  orgId: string;
  orgEmail: string;
  couponCode?: string;
}) {
  const DLOCAL_API_KEY = process.env.DLOCAL_API_KEY;
  const DLOCAL_SECRET = process.env.DLOCAL_SECRET;
  const DLOCAL_URL = process.env.DLOCAL_URL ?? "https://sandbox.dlocal.com";

  if (!DLOCAL_API_KEY || !DLOCAL_SECRET) {
    throw new Error("Dlocal credentials not configured");
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const body = {
    amount: opts.amount,
    currency: opts.currency,
    country: opts.country,
    payment_method_flow: "REDIRECT",
    payer: { email: opts.orgEmail },
    notification_url: `${base}/api/billing/dlocal/webhook`,
    success_url: `${base}/billing/success?provider=dlocal`,
    back_url: `${base}/settings`,
    order_id: `qrj-${opts.orgId}-${Date.now()}`,
    metadata: { organizationId: opts.orgId, planId: opts.planId },
  };

  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(2);
  const toSign = `${DLOCAL_API_KEY}${timestamp}${nonce}${JSON.stringify(body)}`;
  const { createHmac } = await import("crypto");
  const signature = createHmac("sha256", DLOCAL_SECRET).update(toSign).digest("hex");

  const res = await fetch(`${DLOCAL_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Date": timestamp,
      "X-Login": DLOCAL_API_KEY,
      "X-Trans-Key": nonce,
      Authorization: `V2-HMAC-SHA256, Signature: ${signature}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dlocal error: ${err}`);
  }

  return res.json();
}
