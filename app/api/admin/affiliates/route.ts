import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  code: z.string().min(2).max(20),
  commissionRate: z.number().min(0).max(100).default(20),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).default("PENDING"),
  paypalEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function GET() {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const affiliates = await prisma.affiliate.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(affiliates);
}

export async function POST(req: Request) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const code = body.code.toUpperCase();

  const existing = await prisma.affiliate.findFirst({ where: { OR: [{ email: body.email }, { code }] } });
  if (existing) return NextResponse.json({ error: "Email o código ya en uso." }, { status: 409 });

  const affiliate = await prisma.affiliate.create({
    data: { ...body, code, paypalEmail: body.paypalEmail || null },
  });
  return NextResponse.json(affiliate, { status: 201 });
}
