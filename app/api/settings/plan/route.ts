import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendSubscriptionActivatedEmail, sendSubscriptionCanceledEmail, sendAffiliateCommissionEarnedEmail } from "@/lib/email";

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

    const cancelUser = await prisma.user.findFirst({
      where: { organizationId, role: "OWNER" },
      select: { email: true, name: true },
    });
    const cancelOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    if (cancelUser && cancelOrg) {
      await sendSubscriptionCanceledEmail({
        toEmail: cancelUser.email,
        toName: cancelUser.name ?? cancelUser.email,
        orgName: cancelOrg.name,
        accessUntil,
      });
    }

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

  const changeUser = await prisma.user.findFirst({
    where: { organizationId, role: "OWNER" },
    select: { email: true, name: true },
  });
  const changeOrg = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, referredByCode: true },
  });
  if (changeUser && changeOrg) {
    await sendSubscriptionActivatedEmail({
      toEmail: changeUser.email,
      toName: changeUser.name ?? changeUser.email,
      orgName: changeOrg.name,
      planName: plan.name,
      amount: plan.price,
      nextPaymentAt: periodEnd,
    });
  }

  if (changeOrg?.referredByCode) {
    const affiliate = await prisma.affiliate.findFirst({
      where: { code: changeOrg.referredByCode, status: "ACTIVE" },
    });
    if (affiliate) {
      const referral = await prisma.affiliateReferral.findFirst({
        where: { affiliateId: affiliate.id, referredOrganizationId: organizationId, commissionStatus: "PENDING" },
      });
      if (referral) {
        const commissionAmount = parseFloat((plan.price * affiliate.commissionRate / 100).toFixed(2));
        await prisma.$transaction([
          prisma.affiliateReferral.update({
            where: { id: referral.id },
            data: { commissionAmount, commissionStatus: "PENDING" },
          }),
          prisma.affiliate.update({
            where: { id: affiliate.id },
            data: { pendingCommission: { increment: commissionAmount } },
          }),
        ]);
        const updatedAffiliate = await prisma.affiliate.findUnique({
          where: { id: affiliate.id },
          select: { pendingCommission: true },
        });
        await sendAffiliateCommissionEarnedEmail({
          toEmail: affiliate.email,
          toName: affiliate.name,
          referredOrgName: changeOrg.name,
          commissionAmount,
          totalPending: updatedAffiliate?.pendingCommission ?? commissionAmount,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
