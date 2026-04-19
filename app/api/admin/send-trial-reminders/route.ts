import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendTrialEndingEmail } from "@/lib/email";

export async function POST() {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const orgs = await prisma.organization.findMany({
    where: {
      subscriptionStatus: "TRIAL",
      isActive: true,
      trialEndsAt: { gte: in3Days, lte: in4Days },
    },
    include: {
      users: { where: { role: "OWNER" }, select: { email: true, name: true }, take: 1 },
    },
  });

  let sent = 0;
  for (const org of orgs) {
    const owner = org.users[0];
    if (!owner || !org.trialEndsAt) continue;
    const daysLeft = Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    await sendTrialEndingEmail({
      toEmail: owner.email,
      toName: owner.name ?? owner.email,
      orgName: org.name,
      daysLeft,
      trialEndsAt: org.trialEndsAt,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, total: orgs.length });
}
