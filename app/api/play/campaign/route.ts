import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
  const campaign = await prisma.campaign.findUnique({
    where: { qrSlug: slug },
    select: {
      id: true, name: true, gameType: true, status: true,
      primaryColor: true, secondaryColor: true, backgroundColor: true,
      language: true, attemptsPerSession: true, formFields: true,
      upsellEnabled: true, upsellTitle: true, upsellPrice: true,
      upsellCurrency: true, upsellLink: true, upsellImageUrl: true,
      logoUrl: true, participationLimit: true,
      startDate: true, endDate: true, prizes: { select: { title: true, stock: true, validDays: true, deliveredCount: true, prizeImage: true } }, closedRedirectUrl: true, consolePrize: { select: { id: true } },
      raffleDrawDate: true, raffleTerms: true, raffleTermsUrl: true, raffleClaimDays: true, raffleExecutedAt: true,
      rafflePrizes: { select: { id: true, title: true, description: true, imageUrl: true, stock: true } },
      organization: { select: { metaPixelId: true, googleAnalyticsId: true, tiktokPixelId: true } },
    }
  });
  if (!campaign) return NextResponse.json({ error: "Campana no disponible" }, { status: 404 });
  // Para SORTEO permitimos también FINISHED (para mostrar resultados)
  if (campaign.gameType === "SORTEO") {
    if (campaign.status !== "ACTIVE" && campaign.status !== "FINISHED") {
      return NextResponse.json({ error: "Campana no disponible" }, { status: 404 });
    }
  } else {
    if (campaign.status !== "ACTIVE") return NextResponse.json({ error: "Campana no disponible" }, { status: 404 });
  }
  const now = new Date();
  if (campaign.startDate && campaign.startDate > now) return NextResponse.json({ error: "La campana aun no comenzo" }, { status: 403 });
  // Para SORTEO no bloqueamos por endDate (el registro puede haber cerrado pero la página pública sigue activa)
  if (campaign.gameType !== "SORTEO" && campaign.endDate && campaign.endDate < now) return NextResponse.json({ error: "La campana ya finalizo" }, { status: 403 });
  const { organization, ...rest } = campaign as any;
  return NextResponse.json({
    ...rest,
    formFields: typeof rest.formFields === "string" ? JSON.parse(rest.formFields) : rest.formFields,
    metaPixelId: organization?.metaPixelId ?? null,
    googleAnalyticsId: organization?.googleAnalyticsId ?? null,
    tiktokPixelId: organization?.tiktokPixelId ?? null,
  });
}
