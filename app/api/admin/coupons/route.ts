import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(2).max(50),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  value: z.number().min(0),
  currency: z.string().default("USD"),
  maxUses: z.number().int().positive().nullable().default(null),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const coupon = await prisma.coupon.create({
    data: {
      ...body,
      code: body.code.toUpperCase(),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
