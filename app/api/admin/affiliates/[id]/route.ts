import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  paypalEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const affiliate = await prisma.affiliate.update({
    where: { id: params.id },
    data: { ...body, paypalEmail: body.paypalEmail || null },
  });
  return NextResponse.json(affiliate);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await prisma.affiliate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
