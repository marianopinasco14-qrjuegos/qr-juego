import { prisma } from "./prisma";
export interface LimitCheckResult { allowed: boolean; reason?: string; }
export async function checkCampaignLimit(organizationId: string): Promise<LimitCheckResult> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, include: { plan: true, campaigns: { where: { status: { in: ["ACTIVE", "DRAFT", "PAUSED"] } } } } });
  if (!org) return { allowed: false, reason: "Organizacion no encontrada" };
  if (!org.isActive) return { allowed: false, reason: "Tu cuenta esta suspendida" };
  if (org.campaigns.length >= org.plan.maxQrGames) return { allowed: false, reason: `Tu plan ${org.plan.name} permite maximo ${org.plan.maxQrGames} QR juegos.` };
  return { allowed: true };
}
export async function checkScanLimit(campaignId: string): Promise<LimitCheckResult> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { organization: { include: { plan: true } }, _count: { select: { scans: true } } } });
  if (!campaign) return { allowed: false, reason: "Campana no encontrada" };
  if (campaign._count.scans >= campaign.organization.plan.maxScansPerQr) return { allowed: false, reason: "Limite de escaneos alcanzado." };
  return { allowed: true };
}
export async function checkLeadLimit(organizationId: string): Promise<LimitCheckResult> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, include: { plan: true } });
  if (!org) return { allowed: false, reason: "Organizacion no encontrada" };
  if (org.totalLeads >= org.plan.maxLeads) return { allowed: false, reason: "Limite de leads alcanzado." };
  return { allowed: true };
}
