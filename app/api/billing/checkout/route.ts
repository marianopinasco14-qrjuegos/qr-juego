import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPaddleCheckoutUrl, createDlocalPaymentIntent } from "@/lib/billing";

/**
 * GET /api/billing/checkout?planId=xxx&provider=paddle|dlocal&country=AR
 * Redirige al checkout del proveedor de pago correspondiente.
 */
export async function GET(req: Request) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");
  const provider = searchParams.get("provider") ?? "paddle";
  const country = searchParams.get("country") ?? "US";
  const couponCode = searchParams.get("coupon") ?? undefined;

  if (!planId) {
    return NextResponse.json({ error: "planId requerido" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: (payload as any).organizationId },
  });
  if (!org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }

  if (provider === "dlocal") {
    try {
      const intent = await createDlocalPaymentIntent({
        planId: plan.id,
        amount: plan.price,
        currency: "USD",
        country,
        orgId: org.id,
        orgEmail: org.email,
        couponCode,
      });
      // Dlocal devuelve redirect_url
      return NextResponse.redirect(intent.redirect_url);
    } catch (err: any) {
      console.error("[checkout/dlocal]", err.message);
      return NextResponse.json({ error: "Error al crear pago con Dlocal" }, { status: 500 });
    }
  }

  // Default: Paddle
  if (!plan.paddlePriceId) {
    return NextResponse.json(
      { error: "Este plan no tiene Paddle configurado. Contactá a soporte." },
      { status: 400 }
    );
  }

  const checkoutUrl = buildPaddleCheckoutUrl({
    planSlug: plan.slug,
    paddlePriceId: plan.paddlePriceId,
    orgEmail: org.email,
    orgId: org.id,
    couponCode,
  });

  return NextResponse.redirect(checkoutUrl);
}
