import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = (await import("next/headers")).cookies().get("auth-token")?.value;
    const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      include: { rafflePrizes: true },
    });

    if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    if (campaign.gameType !== "SORTEO") return NextResponse.json({ error: "Solo aplica a campañas tipo SORTEO" }, { status: 400 });
    if (campaign.raffleExecutedAt) return NextResponse.json({ error: "El sorteo ya fue ejecutado" }, { status: 409 });
    if (!campaign.raffleDrawDate || new Date() < campaign.raffleDrawDate) {
      return NextResponse.json({ error: "Aún no llegó la fecha del sorteo" }, { status: 400 });
    }
    if (campaign.rafflePrizes.length === 0) return NextResponse.json({ error: "No hay premios configurados" }, { status: 400 });

    const leads = await prisma.lead.findMany({ where: { campaignId: params.id } });
    if (leads.length === 0) return NextResponse.json({ error: "No hay participantes registrados" }, { status: 400 });

    // Calcular fecha de vencimiento
    const claimDays = campaign.raffleClaimDays ?? 7;
    const expiresAt = new Date(campaign.raffleDrawDate);
    expiresAt.setDate(expiresAt.getDate() + claimDays);

    // Sorteo: seleccionar ganadores y suplentes sin repetición entre premios
    const usedLeadIds = new Set<string>();
    const winnersToCreate: {
      campaignId: string;
      rafflePrizeId: string;
      leadId: string;
      isAlternate: boolean;
      position: number;
      redemptionCode: string;
      expiresAt: Date;
    }[] = [];

    for (const prize of campaign.rafflePrizes) {
      const needed = prize.stock + 1; // ganadores + 1 suplente
      const available = leads.filter(l => !usedLeadIds.has(l.id));

      if (available.length === 0) break; // no hay más participantes

      // Fisher-Yates shuffle sobre los disponibles
      const pool = [...available];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      const selected = pool.slice(0, Math.min(needed, pool.length));
      selected.forEach(lead => usedLeadIds.add(lead.id));

      // Los primeros `prize.stock` son ganadores; el último es suplente
      selected.forEach((lead, idx) => {
        const isAlternate = idx >= prize.stock;
        winnersToCreate.push({
          campaignId: params.id,
          rafflePrizeId: prize.id,
          leadId: lead.id,
          isAlternate,
          position: isAlternate ? idx - prize.stock + 1 : idx + 1,
          redemptionCode: "SRT-" + nanoid(10).toUpperCase(),
          expiresAt,
        });
      });
    }

    // Transacción: crear ganadores + actualizar campaña
    const createdWinners = await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        winnersToCreate.map(w => tx.raffleWinner.create({ data: w, include: { lead: true, rafflePrize: true } }))
      );
      await tx.campaign.update({
        where: { id: params.id },
        data: { raffleExecutedAt: new Date(), raffleLocked: true, status: "FINISHED" },
      });
      return created;
    });

    // Enviar emails a ganadores (fuera de la transacción, no crítico)
    const { sendRaffleWinnerEmail } = await import("@/lib/email");
    for (const winner of createdWinners.filter(w => !w.isAlternate)) {
      const leadName = (winner.lead.extraFields as any)?.nombre || winner.lead.email;
      await sendRaffleWinnerEmail({
        campaignId: params.id,
        toEmail: winner.lead.email,
        toName: leadName,
        prizeName: winner.rafflePrize.title,
        redemptionCode: winner.redemptionCode,
        expiresAt: winner.expiresAt,
        raffleTermsUrl: campaign.raffleTermsUrl || undefined,
      });
      await prisma.raffleWinner.update({
        where: { id: winner.id },
        data: { emailSentAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, winnersCount: createdWinners.filter(w => !w.isAlternate).length });
  } catch (error) {
    console.error("Error executing raffle:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
