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
      startDate: true, endDate: true, prizes: { select: { title: true, stock: true, validDays: true, deliveredCount: true, prizeImage: true } }, closedRedirectUrl: true,
    }
  });
  if (!campaign || campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "Campana no disponible" }, { status: 404 });
  }
  const now = new Date();
  if (campaign.startDate && campaign.startDate > now) return NextResponse.json({ error: "La campana aun no comenzo" }, { status: 403 });
  if (campaign.endDate && campaign.endDate < now) return NextResponse.json({ error: "La campana ya finalizo" }, { status: 403 });
  return NextResponse.json({ ...campaign, formFields: typeof campaign.formFields === "string" ? JSON.parse(campaign.formFields) : campaign.formFields });
}
