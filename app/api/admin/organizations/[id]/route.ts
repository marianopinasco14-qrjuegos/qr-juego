import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  planId: z.string().optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED", "SUSPENDED"]).optional(),
  trialEndsAt: z.string().optional(),
  contactName: z.string().max(150).nullable().optional(),
  contactWhatsapp: z.string().max(30).nullable().optional(),
  businessType: z.string().max(100).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const update: any = {};

  if (body.name !== undefined) update.name = body.name;
  if (body.planId) update.planId = body.planId;
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.subscriptionStatus) update.subscriptionStatus = body.subscriptionStatus;
  if (body.trialEndsAt) update.trialEndsAt = new Date(body.trialEndsAt);
  if ("contactName" in body) update.contactName = body.contactName;
  if ("contactWhatsapp" in body) update.contactWhatsapp = body.contactWhatsapp;
  if ("businessType" in body) update.businessType = body.businessType;

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
