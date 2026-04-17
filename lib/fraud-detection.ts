import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
const COOKIE_SECRET = new TextEncoder().encode(process.env.COOKIE_SECRET ?? "fallback-secret-change-in-production-32chars");
export interface FraudCheckResult { allowed: boolean; reason?: string; }
export async function checkFraud(params: { campaignId: string; email: string; whatsapp: string; ipAddress: string; deviceToken?: string; participationLimit?: string; }): Promise<FraudCheckResult> {
  const { campaignId, email, whatsapp, ipAddress, deviceToken, participationLimit = "once_email" } = params;
  if (participationLimit === "once_email") {
    if (await prisma.lead.findUnique({ where: { campaignId_email: { campaignId, email } } })) return { allowed: false, reason: "Ya participaste con este email." };
  } else if (participationLimit === "once_daily") {
    const oneDayAgoEmail = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (await prisma.lead.findFirst({ where: { campaignId, email, createdAt: { gte: oneDayAgoEmail } } })) return { allowed: false, reason: "Ya participaste hoy con este email. Volvé mañana." };
  }
  // unlimited: solo verificar whatsapp, IP y device si no es unlimited
  if (participationLimit !== "unlimited") {
    if (await prisma.lead.findFirst({ where: { campaignId, whatsapp } })) return { allowed: false, reason: "Ya participaste con este WhatsApp." };
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (await prisma.lead.count({ where: { campaignId, ipAddress, createdAt: { gte: oneDayAgo } } }) >= 3) return { allowed: false, reason: "Demasiadas participaciones desde tu conexion." };
    if (deviceToken) { try { const { payload } = await jwtVerify(deviceToken, COOKIE_SECRET); if (payload.campaignId === campaignId) return { allowed: false, reason: "Ya participaste desde este dispositivo." }; } catch {} }
  }
  return { allowed: true };
}
export async function generateDeviceToken(campaignId: string): Promise<string> { return await new SignJWT({ campaignId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("24h").setIssuedAt().sign(COOKIE_SECRET); }
