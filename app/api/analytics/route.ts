import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const token = cookies().get("auth-token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (user as any).organizationId;

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") || undefined;

  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 7);
  defaultFrom.setHours(0, 0, 0, 0);

  const dateFromStr = searchParams.get("dateFrom");
  const dateToStr = searchParams.get("dateTo");

  const dateFrom = dateFromStr ? new Date(dateFromStr + "T00:00:00.000") : defaultFrom;
  const dateTo = dateToStr ? new Date(dateToStr + "T23:59:59.999") : now;

  // Previous period of same duration
  const duration = dateTo.getTime() - dateFrom.getTime();
  const prevDateFrom = new Date(dateFrom.getTime() - duration);
  const prevDateTo = new Date(dateFrom.getTime() - 1);

  // Get all campaigns for this org
  const orgCampaigns = await prisma.campaign.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const allCampaignIds = orgCampaigns.map((c) => c.id);
  const filteredCampaignIds = campaignId ? [campaignId] : allCampaignIds;

  // Edge case: no campaigns
  if (filteredCampaignIds.length === 0) {
    const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return NextResponse.json({
      period: { dateFrom: dateFrom.toISOString(), dateTo: dateTo.toISOString() },
      global: { totalScans: 0, totalLeads: 0, totalWinners: 0, totalRedeemed: 0, totalUpsellClicks: 0, conversionRate: 0, redemptionRate: 0 },
      comparison: {
        scans: { current: 0, previous: 0, change: 0 },
        leads: { current: 0, previous: 0, change: 0 },
        winners: { current: 0, previous: 0, change: 0 },
        redeemed: { current: 0, previous: 0, change: 0 },
      },
      byHour: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
      byWeekday: Array.from({ length: 7 }, (_, i) => ({ dow: i, label: WEEKDAY_LABELS[i], count: 0 })),
      campaigns: [],
      alerts: [],
    });
  }

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  // ── Current period ──
  const [totalScans, totalLeads, totalWinners, totalRedeemed] = await Promise.all([
    prisma.scan.count({
      where: { campaignId: { in: filteredCampaignIds }, playedAt: { gte: dateFrom, lte: dateTo } },
    }),
    prisma.lead.count({
      where: { campaignId: { in: filteredCampaignIds }, createdAt: { gte: dateFrom, lte: dateTo } },
    }),
    prisma.winner.count({
      where: { prize: { campaignId: { in: filteredCampaignIds } }, createdAt: { gte: dateFrom, lte: dateTo } },
    }),
    prisma.winner.count({
      where: { isRedeemed: true, prize: { campaignId: { in: filteredCampaignIds } }, redeemedAt: { gte: dateFrom, lte: dateTo } },
    }),
  ]);

  // ── Previous period ──
  const [prevScans, prevLeads, prevWinners, prevRedeemed] = await Promise.all([
    prisma.scan.count({
      where: { campaignId: { in: filteredCampaignIds }, playedAt: { gte: prevDateFrom, lte: prevDateTo } },
    }),
    prisma.lead.count({
      where: { campaignId: { in: filteredCampaignIds }, createdAt: { gte: prevDateFrom, lte: prevDateTo } },
    }),
    prisma.winner.count({
      where: { prize: { campaignId: { in: filteredCampaignIds } }, createdAt: { gte: prevDateFrom, lte: prevDateTo } },
    }),
    prisma.winner.count({
      where: { isRedeemed: true, prize: { campaignId: { in: filteredCampaignIds } }, redeemedAt: { gte: prevDateFrom, lte: prevDateTo } },
    }),
  ]);

  // ── By hour (raw SQL) ──
  const hourRows = await prisma.$queryRaw<Array<{ hour: number; count: bigint }>>(
    Prisma.sql`
      SELECT EXTRACT(HOUR FROM "playedAt")::int AS hour, COUNT(*)::bigint AS count
      FROM "Scan"
      WHERE "campaignId" IN (${Prisma.join(filteredCampaignIds)})
        AND "playedAt" >= ${dateFrom}
        AND "playedAt" <= ${dateTo}
      GROUP BY hour
      ORDER BY hour
    `
  );
  const hourMap = new Map<number, number>();
  for (const row of hourRows) hourMap.set(row.hour, Number(row.count));
  const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: hourMap.get(i) || 0 }));

  // ── By weekday (raw SQL) ──
  const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const dowRows = await prisma.$queryRaw<Array<{ dow: number; count: bigint }>>(
    Prisma.sql`
      SELECT EXTRACT(DOW FROM "playedAt")::int AS dow, COUNT(*)::bigint AS count
      FROM "Scan"
      WHERE "campaignId" IN (${Prisma.join(filteredCampaignIds)})
        AND "playedAt" >= ${dateFrom}
        AND "playedAt" <= ${dateTo}
      GROUP BY dow
      ORDER BY dow
    `
  );
  const dowMap = new Map<number, number>();
  for (const row of dowRows) dowMap.set(row.dow, Number(row.count));
  const byWeekday = Array.from({ length: 7 }, (_, i) => ({
    dow: i,
    label: WEEKDAY_LABELS[i],
    count: dowMap.get(i) || 0,
  }));

  // ── Per campaign ──
  const nowDate = new Date();
  const in7days = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const campaignFilter = campaignId ? { organizationId, id: campaignId } : { organizationId };
  const campaignDetails = await prisma.campaign.findMany({
    where: campaignFilter,
    include: { prizes: true },
    orderBy: { createdAt: "desc" },
  });

  const campaignAnalytics = await Promise.all(
    campaignDetails.map(async (c) => {
      const [leads, scans, winners, redeemed] = await Promise.all([
        prisma.lead.count({ where: { campaignId: c.id, createdAt: { gte: dateFrom, lte: dateTo } } }),
        prisma.scan.count({ where: { campaignId: c.id, playedAt: { gte: dateFrom, lte: dateTo } } }),
        prisma.winner.count({ where: { prize: { campaignId: c.id }, createdAt: { gte: dateFrom, lte: dateTo } } }),
        prisma.winner.count({ where: { isRedeemed: true, prize: { campaignId: c.id }, redeemedAt: { gte: dateFrom, lte: dateTo } } }),
      ]);

      const prizesWithStats = await Promise.all(
        c.prizes.map(async (p) => {
          const [expiringSoon, expired] = await Promise.all([
            prisma.winner.count({ where: { prizeId: p.id, isRedeemed: false, expiresAt: { gte: nowDate, lte: in7days } } }),
            prisma.winner.count({ where: { prizeId: p.id, isRedeemed: false, expiresAt: { lt: nowDate } } }),
          ]);
          const stockRemaining = p.stock - p.deliveredCount;
          const stockPercentage = p.stock > 0 ? Math.round((stockRemaining / p.stock) * 100) : 0;
          return {
            id: p.id,
            title: p.title,
            stock: p.stock,
            deliveredCount: p.deliveredCount,
            stockRemaining,
            stockPercentage,
            isCritical: stockRemaining < p.stock * 0.2,
            winnersExpiringSoon: expiringSoon,
            winnersExpired: expired,
          };
        })
      );

      return {
        id: c.id,
        name: c.name,
        gameType: c.gameType,
        status: c.status,
        qrSlug: c.qrSlug,
        leads,
        scans,
        winners,
        redeemed,
        conversionRate: scans > 0 ? Math.round((leads / scans) * 100) : 0,
        prizes: prizesWithStats,
      };
    })
  );

  // ── Alerts ──
  const alerts: Array<{
    type: "EXPIRING_SOON" | "STOCK_CRITICAL" | "EXPIRED";
    campaignName: string;
    prizeName: string;
    campaignId: string;
    detail: string;
  }> = [];

  for (const c of campaignAnalytics) {
    for (const p of c.prizes) {
      if (p.winnersExpiringSoon > 0) {
        alerts.push({
          type: "EXPIRING_SOON",
          campaignName: c.name,
          prizeName: p.title,
          campaignId: c.id,
          detail: `${p.winnersExpiringSoon} premio${p.winnersExpiringSoon !== 1 ? "s" : ""} vence${p.winnersExpiringSoon !== 1 ? "n" : ""} en 7 días`,
        });
      }
      if (p.isCritical && p.stock > 0) {
        alerts.push({
          type: "STOCK_CRITICAL",
          campaignName: c.name,
          prizeName: p.title,
          campaignId: c.id,
          detail: `Stock crítico: ${p.stockRemaining} restante${p.stockRemaining !== 1 ? "s" : ""}`,
        });
      }
      if (p.winnersExpired > 0) {
        alerts.push({
          type: "EXPIRED",
          campaignName: c.name,
          prizeName: p.title,
          campaignId: c.id,
          detail: `${p.winnersExpired} premio${p.winnersExpired !== 1 ? "s" : ""} vencido${p.winnersExpired !== 1 ? "s" : ""} sin canjear`,
        });
      }
    }
  }

  return NextResponse.json({
    period: { dateFrom: dateFrom.toISOString(), dateTo: dateTo.toISOString() },
    global: {
      totalScans,
      totalLeads,
      totalWinners,
      totalRedeemed,
      totalUpsellClicks: 0,
      conversionRate: totalScans > 0 ? Math.round((totalLeads / totalScans) * 100) : 0,
      redemptionRate: totalWinners > 0 ? Math.round((totalRedeemed / totalWinners) * 100) : 0,
    },
    comparison: {
      scans: { current: totalScans, previous: prevScans, change: pctChange(totalScans, prevScans) },
      leads: { current: totalLeads, previous: prevLeads, change: pctChange(totalLeads, prevLeads) },
      winners: { current: totalWinners, previous: prevWinners, change: pctChange(totalWinners, prevWinners) },
      redeemed: { current: totalRedeemed, previous: prevRedeemed, change: pctChange(totalRedeemed, prevRedeemed) },
    },
    byHour,
    byWeekday,
    campaigns: campaignAnalytics,
    alerts,
  });
}
