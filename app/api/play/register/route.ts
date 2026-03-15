import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkFraud, generateDeviceToken } from "@/lib/fraud-detection";
import { checkScanLimit, checkLeadLimit } from "@/lib/plan-limits";
import { registerLeadSchema } from "@/lib/validations";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerLeadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    const { campaignId, email, whatsapp, extraFields } = parsed.data;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    const deviceToken = req.cookies.get(`qrj_${campaignId}`)?.value;
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { organization: true } });
    if (!campaign || campaign.status !== "ACTIVE") return NextResponse.json({ error: "Campana no disponible." }, { status: 404 });
    const now = new Date();
    if (campaign.startDate && campaign.startDate > now) return NextResponse.json({ error: "La campana aun no comenzo." }, { status: 403 });
    if (campaign.endDate && campaign.endDate < now) return NextResponse.json({ error: "La campana ya finalizo." }, { status: 403 });
    const scanLimit = await checkScanLimit(campaignId);
    if (!scanLimit.allowed) return NextResponse.json({ error: scanLimit.reason }, { status: 403 });
    const leadLimit = await checkLeadLimit(campaign.organizationId);
    if (!leadLimit.allowed) return NextResponse.json({ error: leadLimit.reason }, { status: 403 });
    const fraudCheck = await checkFraud({ campaignId, email, whatsapp, ipAddress, deviceToken });
    if (!fraudCheck.allowed) return NextResponse.json({ error: fraudCheck.reason }, { status: 409 });
    const lead = await prisma.lead.create({ data: { campaignId, email, whatsapp, extraFields: extraFields ?? {}, ipAddress, deviceToken } });
    await prisma.organization.update({ where: { id: campaign.organizationId }, data: { totalLeads: { increment: 1 } } });
    const newDeviceToken = await generateDeviceToken(campaignId);
    const response = NextResponse.json({ success: true, leadId: lead.id });
    response.cookies.set(`qrj_${campaignId}`, newDeviceToken, { httpOnly: true, sameSite: "strict", maxAge: 86400, path: "/" });
    return response;
  } catch (error) { console.error("Error register:", error); return NextResponse.json({ error: "Error interno." }, { status: 500 }); }
}
