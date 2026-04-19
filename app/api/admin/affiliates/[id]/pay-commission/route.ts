import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendAffiliateCommissionPaidEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const affiliate = await prisma.affiliate.findUnique({ where: { id: params.id } });
  if (!affiliate) return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });

  const amountToNotify = affiliate.pendingCommission;
  const now = new Date();

  await prisma.$transaction([
    prisma.affiliateReferral.updateMany({
      where: { affiliateId: params.id, commissionStatus: "PENDING" },
      data: { commissionStatus: "PAID", paidAt: now },
    }),
    prisma.affiliate.update({
      where: { id: params.id },
      data: {
        totalCommissionEarned: { increment: amountPaid },
        pendingCommission: 0,
      },
    }),
  ]);

  await sendAffiliateCommissionPaidEmail({
    toEmail: affiliate.email,
    toName: affiliate.name,
    amountPaid: amountToNotify,
    paypalEmail: affiliate.paypalEmail,
  });

  return NextResponse.json({ success: true, affiliateId: params.id, amountPaid: amountToNotify });
}
