import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  yearlyPrice: z.number().min(0).optional(),
  trialDays: z.number().int().min(0).optional(),
  maxQrGames: z.number().int().min(1).optional(),
  maxScansPerQr: z.number().int().min(1).optional(),
  maxLeads: z.number().int().min(1).optional(),
  features: z.array(z.string()).optional(),
  whiteLabelEnabled: z.boolean().optional(),
  webhooksEnabled: z.boolean().optional(),
  affiliatesEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const plan = await prisma.plan.update({ where: { id: params.id }, data: body });
  return NextResponse.json(plan);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const using = await prisma.organization.count({ where: { planId: params.id } });
  if (using > 0) {
    return NextResponse.json({ error: `Este plan tiene ${using} organización(es) activa(s).` }, { status: 400 });
  }
  await prisma.plan.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
