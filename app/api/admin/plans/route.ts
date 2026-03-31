import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  yearlyPrice: z.number().min(0).default(0),
  trialDays: z.number().int().min(0).default(14),
  maxQrGames: z.number().int().min(1),
  maxScansPerQr: z.number().int().min(1),
  maxLeads: z.number().int().min(1),
  features: z.array(z.string()).default([]),
  whiteLabelEnabled: z.boolean().default(false),
  webhooksEnabled: z.boolean().default(false),
  affiliatesEnabled: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const plan = await prisma.plan.create({ data: body });
  return NextResponse.json(plan, { status: 201 });
}
