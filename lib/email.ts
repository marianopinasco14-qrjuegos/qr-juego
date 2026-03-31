import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWinnerEmail(params: { campaignId: string; toEmail: string; toName: string; prizeName: string; redemptionCode: string; expiresAt: Date; }) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { campaignId_type: { campaignId: params.campaignId, type: "WINNER" } } });
    if (!template) return;

    const redeemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/staff/redeem/${params.redemptionCode}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(redeemUrl)}`;

    const bodyText = template.bodyHtml
      .replace(/{{name}}/g, params.toName)
      .replace(/{{prize}}/g, params.prizeName)
      .replace(/{{redemptionCode}}/g, params.redemptionCode)
      .replace(/{{expiresAt}}/g, params.expiresAt.toLocaleDateString("es-AR"));

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #7C3AED, #A78BFA); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🏆 ¡Ganaste!</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px;">${bodyText}</p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">Tu código de canje</p>
        <p style="font-family: monospace; font-size: 22px; font-weight: bold; color: #7C3AED; letter-spacing: 3px;">${params.redemptionCode}</p>
        <p style="color: #999; font-size: 12px;">Válido hasta: ${params.expiresAt.toLocaleDateString("es-AR")}</p>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">Mostrá este QR al empleado para canjear tu premio</p>
        <img src="${qrImageUrl}" alt="QR de canje" style="width: 200px; height: 200px; border-radius: 12px;"/>
      </div>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({ from: "QR Juego <noreply@qrjuego.app>", to: params.toEmail, subject: template.subject, html });
  } catch (e) { console.error("Email ganador error (no critico):", e); }
}

export async function sendConsoleEmail(params: { campaignId: string; toEmail: string; toName: string; couponCode: string; }) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { campaignId_type: { campaignId: params.campaignId, type: "CONSOLE" } } });
    if (!template) return;

    const bodyText = template.bodyHtml
      .replace(/{{name}}/g, params.toName)
      .replace(/{{couponCode}}/g, params.couponCode);

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎁 Tu regalo especial</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px;">${bodyText}</p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; border: 2px dashed #f59e0b;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">Tu código especial</p>
        <p style="font-family: monospace; font-size: 22px; font-weight: bold; color: #f59e0b; letter-spacing: 3px;">${params.couponCode}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({ from: "QR Juego <noreply@qrjuego.app>", to: params.toEmail, subject: template.subject, html });
  } catch (e) { console.error("Email consuelo error (no critico):", e); }
}
