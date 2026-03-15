import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consolePrizeSchema } from "@/lib/validations";
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const parsed = consolePrizeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const consolePrize = await prisma.consolePrize.upsert({ where: { campaignId: params.id }, update: { title: parsed.data.title, description: parsed.data.description ?? null, couponCode: parsed.data.couponCode }, create: { campaignId: params.id, title: parsed.data.title, description: parsed.data.description ?? null, couponCode: parsed.data.couponCode } });
  return NextResponse.json(consolePrize);
}
