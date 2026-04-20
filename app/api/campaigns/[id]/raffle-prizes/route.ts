import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = (await import("next/headers")).cookies().get("auth-token")?.value;
    const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      select: { id: true, gameType: true, raffleLocked: true },
    });
    if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    if (campaign.gameType !== "SORTEO") return NextResponse.json({ error: "Solo aplica a campañas tipo SORTEO" }, { status: 400 });
    if (campaign.raffleLocked) return NextResponse.json({ error: "La campaña está bloqueada" }, { status: 403 });

    const { title, description, imageUrl, stock } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "El título es requerido" }, { status: 400 });

    const prize = await prisma.rafflePrize.create({
      data: {
        campaignId: params.id,
        title: title.trim(),
        description: description || null,
        imageUrl: imageUrl || null,
        stock: stock ? parseInt(stock) : 1,
      },
    });

    return NextResponse.json(prize, { status: 201 });
  } catch (error) {
    console.error("Error creating raffle prize:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
