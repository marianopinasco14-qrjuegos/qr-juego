import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prizeSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; prizeId: string } }) {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = prizeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const prize = await prisma.prize.update({
    where: { id: params.prizeId, campaignId: params.id },
    data: {
      title: parsed.data.title,
      stock: parsed.data.stock,
      priority: parsed.data.priority,
      frequency: parsed.data.frequency,
      validDays: parsed.data.validDays,
      prizeImage: parsed.data.prizeImage ?? null,
    },
  });

  return NextResponse.json(prize);
}
