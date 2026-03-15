import { Prisma } from "@prisma/client";
export interface PrizeEngineResult { isWinner: boolean; prizeId?: string; prizeTitle?: string; prizeDescription?: string; redemptionCode?: string; expiresAt?: Date; consolePrizeTitle?: string; consolePrizeDescription?: string; consolePrizeCoupon?: string; }
export async function executePrizeEngine(campaignId: string, leadId: string, tx: Prisma.TransactionClient): Promise<PrizeEngineResult> {
  const totalScans = await tx.scan.count({ where: { campaignId } });
  const prizes = await tx.$queryRaw<Array<{ id: string; title: string; description: string | null; stock: number; priority: number; frequency: number; validDays: number; }>>`SELECT id, title, description, stock, priority, frequency, "validDays" FROM "Prize" WHERE "campaignId" = ${campaignId} AND "isActive" = true AND stock > 0 FOR UPDATE`;
  if (prizes.length === 0) return getConsolePrize(campaignId, tx);
  const candidates = prizes.filter((prize) => { const pos = totalScans % prize.frequency; const remaining = prize.frequency - pos; return Math.random() < (1 / remaining); });
  if (candidates.length === 0) return getConsolePrize(campaignId, tx);
  const selected = weightedRandom(candidates, candidates.map((p) => p.priority));
  const updated = await tx.$executeRaw`UPDATE "Prize" SET stock = stock - 1, "deliveredCount" = "deliveredCount" + 1, "updatedAt" = NOW() WHERE id = ${selected.id} AND stock > 0`;
  if (updated === 0) return getConsolePrize(campaignId, tx);
  const redemptionCode = generateRedemptionCode();
  const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + selected.validDays);
  await tx.winner.create({ data: { prizeId: selected.id, leadId, redemptionCode, expiresAt } });
  return { isWinner: true, prizeId: selected.id, prizeTitle: selected.title, prizeDescription: selected.description ?? undefined, redemptionCode, expiresAt };
}
async function getConsolePrize(campaignId: string, tx: Prisma.TransactionClient): Promise<PrizeEngineResult> {
  const c = await tx.consolePrize.findUnique({ where: { campaignId } });
  return { isWinner: false, consolePrizeTitle: c?.title ?? "Mejor suerte la proxima!", consolePrizeDescription: c?.description ?? undefined, consolePrizeCoupon: c?.couponCode ?? undefined };
}
export function weightedRandom<T>(items: T[], weights: number[]): T { const total = weights.reduce((a, b) => a + b, 0); let r = Math.random() * total; for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }
export function generateRedemptionCode(): string { const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; let code = "QRJ-"; for (let i = 0; i < 10; i++) code += chars.charAt(Math.floor(Math.random() * chars.length)); return code; }
