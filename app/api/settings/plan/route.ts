import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const changeSchema = z.object({ action: z.literal("change"), planSlug: z.string() });
const cancelSchema = z.object({ action: z.literal("cancel") });
const bodySchema = z.union([changeSchema, cancelSchema]);

export async function PATCH(req: Request) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const organizationId = (payload as any).organizationId;
  const body = bodySchema.parse(await req.json());

  if (body.action === "cancel") {
    const now = new Date();
    // Find current active/trial subscription to know access end date
    const sub = await prisma.subscription.findFirst({
      where: { organizationId, status: { in: ["ACTIVE", "TRIAL"] } },
      orderBy: { createdAt: "desc" },
    });

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: organizationId },
        data: { subscriptionStatus: "CANCELED" },
      }),
      prisma.subscription.updateMany({
        where: { organizationId, status: { in: ["ACTIVE", "TRIAL"] } },
        data: { status: "CANCELED", canceledAt: now },
      }),
    ]);

    const accessUntil = sub?.currentPeriodEnd ?? sub?.trialEnd ?? now;
    return NextResponse.json({ ok: true, accessUntil });
  }

  // action === "change"
  const plan = await prisma.plan.findUnique({ where: { slug: body.planSlug } });
  if (!plan || !plan.isActive || !plan.isPublic) {
    return NextResponse.json({ error: "Plan no disponible" }, { status: 404 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: { subscriptionStatus: "ACTIVE", planId: plan.id },
    }),
    prisma.subscription.updateMany({
      where: { organizationId, status: { in: ["TRIAL", "ACTIVE", "PAST_DUE"] } },
      data: {
        status: "ACTIVE",
        planId: plan.id,
        provider: "MANUAL",
        amount: plan.price,
        currency: "USD",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        lastPaymentAt: now,
        nextPaymentAt: periodEnd,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
