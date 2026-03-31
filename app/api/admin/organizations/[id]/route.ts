import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  planId: z.string().optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED", "SUSPENDED"]).optional(),
  trialEndsAt: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const update: any = {};

  if (body.planId) update.planId = body.planId;
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.subscriptionStatus) update.subscriptionStatus = body.subscriptionStatus;
  if (body.trialEndsAt) update.trialEndsAt = new Date(body.trialEndsAt);

  const org = await prisma.organization.update({
    where: { id: params.id },
    data: update,
  });

  return NextResponse.json(org);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.organization.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
