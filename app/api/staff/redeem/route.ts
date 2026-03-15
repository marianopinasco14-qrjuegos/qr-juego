import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redeemSchema } from "@/lib/validations";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    const { redemptionCode, staffPin, organizationId } = parsed.data;
    const staffPinRecord = await prisma.staffPin.findFirst({ where: { organizationId, pin: staffPin, isActive: true } });
    if (!staffPinRecord) return NextResponse.json({ valid: false, message: "PIN de staff invalido." }, { status: 403 });
    const winner = await prisma.winner.findUnique({ where: { redemptionCode }, include: { prize: { include: { campaign: { include: { organization: true } } } }, lead: true } });
    if (!winner) return NextResponse.json({ valid: false, message: "Codigo no encontrado." });
    if (winner.prize.campaign.organizationId !== organizationId) return NextResponse.json({ valid: false, message: "Codigo no corresponde a tu organizacion." });
    if (winner.isRedeemed) return NextResponse.json({ valid: false, alreadyRedeemed: true, message: `Ya fue canjeado el ${winner.redeemedAt?.toLocaleDateString("es-AR")}.` });
    if (new Date() > winner.expiresAt) return NextResponse.json({ valid: false, message: "Este premio ya expiro." });
    await prisma.$transaction([prisma.winner.update({ where: { id: winner.id }, data: { isRedeemed: true, redeemedAt: new Date(), redeemedByPin: staffPin } }), prisma.staffPin.update({ where: { id: staffPinRecord.id }, data: { redeemedCount: { increment: 1 } } })]);
    return NextResponse.json({ valid: true, message: "Premio canjeado exitosamente.", prizeName: winner.prize.title, customerEmail: winner.lead.email });
  } catch (error) { console.error("Error redeem:", error); return NextResponse.json({ error: "Error interno." }, { status: 500 }); }
}
