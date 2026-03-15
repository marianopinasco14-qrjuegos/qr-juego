import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prizeSchema } from "@/lib/validations";
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const parsed = prizeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const prize = await prisma.prize.create({ data: { campaignId: params.id, title: parsed.data.title, description: parsed.data.description ?? null, stock: parsed.data.stock, priority: parsed.data.priority, frequency: parsed.data.frequency, validDays: parsed.data.validDays } });
  return NextResponse.json(prize);
}
