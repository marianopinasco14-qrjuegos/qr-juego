import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  value: z.number().min(0).optional(),
  currency: z.string().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const coupon = await prisma.coupon.update({
    where: { id: params.id },
    data: {
      ...body,
      validUntil: body.validUntil !== undefined ? (body.validUntil ? new Date(body.validUntil) : null) : undefined,
    },
  });
  return NextResponse.json(coupon);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.coupon.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
