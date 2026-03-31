import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchWebhook } from "@/lib/webhooks";

export async function POST(req: NextRequest) {
  try {
    const { redemptionCode, staffPin } = await req.json();
    if (!redemptionCode || !staffPin) return NextResponse.json({ valid: false, message: "Datos incompletos." }, { status: 400 });

    const staffPinRecord = await prisma.staffPin.findFirst({ where: { pin: staffPin, isActive: true }, include: { organization: true } });
    if (!staffPinRecord) return NextResponse.json({ valid: false, message: "PIN de staff inválido." }, { status: 403 });

    const organizationId = staffPinRecord.organizationId;

    const winner = await prisma.winner.findUnique({ where: { redemptionCode }, include: { prize: { include: { campaign: { include: { organization: true } } } }, lead: true } });
    if (!winner) return NextResponse.json({ valid: false, message: "Código no encontrado." });
    if (winner.prize.campaign.organizationId !== organizationId) return NextResponse.json({ valid: false, message: "Código no corresponde a tu organización." });
    if (winner.isRedeemed) return NextResponse.json({ valid: false, alreadyRedeemed: true, message: `Ya fue canjeado el ${winner.redeemedAt?.toLocaleDateString("es-AR")}.` });
    if (new Date() > winner.expiresAt) return NextResponse.json({ valid: false, message: "Este premio ya expiró." });

    await prisma.$transaction([
      prisma.winner.update({ where: { id: winner.id }, data: { isRedeemed: true, redeemedAt: new Date(), redeemedByPin: staffPin } }),
      prisma.staffPin.update({ where: { id: staffPinRecord.id }, data: { redeemedCount: { increment: 1 } } })
    ]);

    dispatchWebhook(organizationId, "prize.redeemed", {
      redemptionCode,
      prizeName: winner.prize.title,
      customerEmail: winner.lead.email,
      staffPin,
    });
    return NextResponse.json({ valid: true, message: "¡Premio canjeado exitosamente!", prizeName: winner.prize.title, customerEmail: winner.lead.email });
  } catch (error) {
    console.error("Error redeem:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
