import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
const COOKIE_SECRET = new TextEncoder().encode(process.env.COOKIE_SECRET ?? "fallback-secret-change-in-production-32chars");
export interface FraudCheckResult { allowed: boolean; reason?: string; }
export async function checkFraud(params: { campaignId: string; email: string; whatsapp: string; ipAddress: string; deviceToken?: string; participationLimit?: string; }): Promise<FraudCheckResult> {
  const { campaignId, email, whatsapp, deviceToken, participationLimit = "once_email" } = params;

  if (participationLimit === "unlimited") {
    return { allowed: true };
  }

  if (participationLimit === "once_email") {
    if (await prisma.lead.findFirst({ where: { campaignId, email } }))
      return { allowed: false, reason: "Ya participaste con este email." };
    if (await prisma.lead.findFirst({ where: { campaignId, whatsapp } }))
      return { allowed: false, reason: "Ya participaste con este número de WhatsApp." };
    if (deviceToken) {
      try {
        const { payload } = await jwtVerify(deviceToken, COOKIE_SECRET);
        if (payload.campaignId === campaignId)
          return { allowed: false, reason: "Ya participaste desde este dispositivo." };
      } catch {}
    }
  } else if (participationLimit === "once_daily") {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (await prisma.lead.findFirst({ where: { campaignId, email, createdAt: { gte: since24h } } }))
      return { allowed: false, reason: "Ya participaste hoy con este email. Volvé mañana." };
    if (await prisma.lead.findFirst({ where: { campaignId, whatsapp, createdAt: { gte: since24h } } }))
      return { allowed: false, reason: "Ya participaste hoy con este número de WhatsApp. Volvé mañana." };
    if (deviceToken) {
      try {
        const { payload } = await jwtVerify(deviceToken, COOKIE_SECRET);
        if (payload.campaignId === campaignId)
          return { allowed: false, reason: "Ya participaste hoy desde este dispositivo. Volvé mañana." };
      } catch {}
    }
  }

  return { allowed: true };
}
export async function generateDeviceToken(campaignId: string): Promise<string> { return await new SignJWT({ campaignId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("24h").setIssuedAt().sign(COOKIE_SECRET); }
