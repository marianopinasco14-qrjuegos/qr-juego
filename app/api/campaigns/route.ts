import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkCampaignLimit } from "@/lib/plan-limits";
import { campaignFormSchema } from "@/lib/validations";
import { nanoid } from "nanoid";
export async function GET() {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  const campaigns = await prisma.campaign.findMany({ where: { organizationId }, include: { prizes: { select: { id: true, title: true, stock: true, deliveredCount: true } }, consolePrize: true, _count: { select: { leads: true, scans: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(campaigns);
}
export async function POST(req: NextRequest) {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  const limitCheck = await checkCampaignLimit(organizationId);
  if (!limitCheck.allowed) return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
  const body = await req.json();
  const parsed = campaignFormSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const campaign = await prisma.campaign.create({ data: { organizationId, qrSlug: nanoid(12), name: parsed.data.name, gameType: parsed.data.gameType, attemptsPerSession: parsed.data.attemptsPerSession, primaryColor: parsed.data.primaryColor, secondaryColor: parsed.data.secondaryColor, backgroundColor: parsed.data.backgroundColor, language: parsed.data.language as any, ageGate: parsed.data.ageGate, formFields: JSON.stringify(parsed.data.formFields), startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null, endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null, upsellEnabled: parsed.data.upsellEnabled, upsellTitle: parsed.data.upsellTitle ?? null, upsellPrice: parsed.data.upsellPrice ?? null, upsellCurrency: parsed.data.upsellCurrency ?? "ARS", upsellLink: parsed.data.upsellLink ?? null, upsellImageUrl: parsed.data.upsellImageUrl ?? null, logoUrl: parsed.data.logoUrl ?? null, participationLimit: parsed.data.participationLimit ?? "once_email", closedBehavior: parsed.data.closedBehavior as any, closedRedirectUrl: parsed.data.closedRedirectUrl ?? null } });
  return NextResponse.json(campaign);
}
