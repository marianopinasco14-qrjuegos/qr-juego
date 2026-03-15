import { Resend } from "resend";
import { prisma } from "./prisma";
const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendWinnerEmail(params: { campaignId: string; toEmail: string; toName: string; prizeName: string; redemptionCode: string; expiresAt: Date; }) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { campaignId_type: { campaignId: params.campaignId, type: "WINNER" } } });
    if (!template) return;
    const html = template.bodyHtml.replace(/{{name}}/g, params.toName).replace(/{{prize}}/g, params.prizeName).replace(/{{redemptionCode}}/g, params.redemptionCode).replace(/{{expiresAt}}/g, params.expiresAt.toLocaleDateString("es-AR"));
    await resend.emails.send({ from: "QR Juego <noreply@qrjuego.app>", to: params.toEmail, subject: template.subject, html });
  } catch (e) { console.error("Email ganador error (no critico):", e); }
}
export async function sendConsoleEmail(params: { campaignId: string; toEmail: string; toName: string; couponCode: string; }) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { campaignId_type: { campaignId: params.campaignId, type: "CONSOLE" } } });
    if (!template) return;
    const html = template.bodyHtml.replace(/{{name}}/g, params.toName).replace(/{{couponCode}}/g, params.couponCode);
    await resend.emails.send({ from: "QR Juego <noreply@qrjuego.app>", to: params.toEmail, subject: template.subject, html });
  } catch (e) { console.error("Email consuelo error (no critico):", e); }
}
