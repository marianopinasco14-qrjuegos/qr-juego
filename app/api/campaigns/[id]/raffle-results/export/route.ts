import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = (await import("next/headers")).cookies().get("auth-token")?.value;
    const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      select: { id: true, gameType: true },
    });
    if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    if (campaign.gameType !== "SORTEO") return NextResponse.json({ error: "Solo aplica a campañas tipo SORTEO" }, { status: 400 });

    const winners = await prisma.raffleWinner.findMany({
      where: { campaignId: params.id },
      include: {
        rafflePrize: { select: { title: true } },
        lead: { select: { email: true, whatsapp: true, extraFields: true } },
      },
      orderBy: [{ rafflePrizeId: "asc" }, { isAlternate: "asc" }, { position: "asc" }],
    });

    const header = "Premio,Tipo,Nombre,Email,WhatsApp,Código de canje,Canjeado,Fecha canje\n";
    const rows = winners.map(w => {
      const name = (w.lead.extraFields as any)?.nombre || "";
      const tipo = w.isAlternate ? "Suplente" : "Ganador";
      const canjeado = w.isRedeemed ? "SI" : "NO";
      const fechaCanje = w.redeemedAt ? w.redeemedAt.toLocaleDateString("es-AR") : "";
      return [w.rafflePrize.title, tipo, name, w.lead.email, w.lead.whatsapp, w.redemptionCode, canjeado, fechaCanje]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = header + rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sorteo-${params.id}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting raffle results:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
