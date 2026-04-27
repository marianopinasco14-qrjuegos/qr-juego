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

    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: template.subject, html });
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

    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: template.subject, html });
  } catch (e) { console.error("Email consuelo error (no critico):", e); }
}

export async function sendWelcomeEmail(params: { toEmail: string; toName: string; orgName: string; trialDays: number; trialEndsAt: Date }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const fechaFin = params.trialEndsAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#7C3AED,#A78BFA);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">¡Bienvenido a QR Juego! 🎯</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, tu cuenta <strong>${params.orgName}</strong> ya está activa.</p>
    <div style="background:#f3f0ff;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #7C3AED;">
      <p style="color:#7C3AED;font-weight:bold;margin:0;font-size:15px;">Tu trial de ${params.trialDays} días vence el ${fechaFin}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/dashboard" style="background:#7C3AED;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;">Ir al dashboard →</a>
    </div>
    <p style="color:#555;font-size:14px;font-weight:bold;margin-bottom:8px;">¿Por dónde empezar?</p>
    <ol style="color:#666;font-size:14px;line-height:1.8;padding-left:20px;margin:0;">
      <li>Creá tu primer QR Juego</li>
      <li>Compartí el QR con tus clientes</li>
      <li>Mirá tus leads crecer</li>
    </ol>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: `¡Bienvenido a QR Juego! Tu trial de ${params.trialDays} días ya está activo 🎯`, html });
    const org = await prisma.organization.findFirst({ where: { email: params.toEmail }, select: { id: true } });
    if (org) {
      await prisma.emailLog.create({ data: { organizationId: org.id, to: params.toEmail, subject: `¡Bienvenido a QR Juego! Tu trial de ${params.trialDays} días ya está activo 🎯`, type: "WELCOME", status: "SENT" } });
    }
  } catch (e) { console.error("sendWelcomeEmail error:", e); }
}

export async function sendTrialEndingEmail(params: { toEmail: string; toName: string; orgName: string; daysLeft: number; trialEndsAt: Date }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const fechaFin = params.trialEndsAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">⏰ Tu trial vence en ${params.daysLeft} días</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, tu trial de <strong>${params.orgName}</strong> vence el <strong>${fechaFin}</strong>.</p>
    <div style="background:#fffbeb;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #f59e0b;">
      <p style="color:#92400e;font-weight:bold;margin:0;font-size:15px;">⚡ Quedan ${params.daysLeft} días para elegir tu plan</p>
    </div>
    <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="color:#333;font-weight:bold;margin:0 0 12px;">¿Qué perdés si no elegís un plan?</p>
      <p style="color:#666;margin:4px 0;font-size:14px;">❌ Tus campañas activas se pausarán</p>
      <p style="color:#666;margin:4px 0;font-size:14px;">❌ Tus leads y datos quedarán inaccesibles</p>
      <p style="color:#666;margin:4px 0;font-size:14px;">❌ Tus clientes no podrán participar en tus juegos</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/settings" style="background:#f59e0b;color:white;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block;">Ver planes y precios →</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">Si ya elegiste un plan, ignorá este mensaje.</p>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: `⏰ Tu trial vence en ${params.daysLeft} días — Elegí tu plan`, html });
    const org = await prisma.organization.findFirst({ where: { email: params.toEmail }, select: { id: true } });
    if (org) {
      await prisma.emailLog.create({ data: { organizationId: org.id, to: params.toEmail, subject: `⏰ Tu trial vence en ${params.daysLeft} días — Elegí tu plan`, type: "TRIAL_EXPIRING", status: "SENT" } });
    }
  } catch (e) { console.error("sendTrialEndingEmail error:", e); }
}

export async function sendSubscriptionActivatedEmail(params: { toEmail: string; toName: string; orgName: string; planName: string; amount: number; nextPaymentAt: Date }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const fechaRenovacion = params.nextPaymentAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">✅ ¡Suscripción activada!</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, tu suscripción de <strong>${params.orgName}</strong> está activa.</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #16a34a;">
      <p style="color:#166534;font-weight:bold;margin:0 0 6px;font-size:15px;">Plan ${params.planName} — $${params.amount.toFixed(2)} USD/mes</p>
      <p style="color:#4ade80;margin:0;font-size:13px;">Próxima renovación: ${fechaRenovacion}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/dashboard" style="background:#16a34a;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;">Ir al dashboard →</a>
    </div>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: `✅ Suscripción activada — Plan ${params.planName}`, html });
    const org = await prisma.organization.findFirst({ where: { email: params.toEmail }, select: { id: true } });
    if (org) {
      await prisma.emailLog.create({ data: { organizationId: org.id, to: params.toEmail, subject: `✅ Suscripción activada — Plan ${params.planName}`, type: "SUBSCRIPTION_ACTIVATED", status: "SENT" } });
    }
  } catch (e) { console.error("sendSubscriptionActivatedEmail error:", e); }
}

export async function sendSubscriptionCanceledEmail(params: { toEmail: string; toName: string; orgName: string; accessUntil: Date }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const fechaAcceso = params.accessUntil.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#4b5563,#6b7280);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">Tu suscripción fue cancelada</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, cancelaste la suscripción de <strong>${params.orgName}</strong>.</p>
    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #6b7280;">
      <p style="color:#374151;font-weight:bold;margin:0;font-size:15px;">Tenés acceso hasta el ${fechaAcceso}</p>
    </div>
    <p style="color:#555;font-size:14px;text-align:center;">Podés reactivar tu cuenta en cualquier momento.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/settings" style="background:#7C3AED;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;">Reactivar cuenta →</a>
    </div>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: `Suscripción cancelada — Acceso hasta ${fechaAcceso}`, html });
    const org = await prisma.organization.findFirst({ where: { email: params.toEmail }, select: { id: true } });
    if (org) {
      await prisma.emailLog.create({ data: { organizationId: org.id, to: params.toEmail, subject: `Suscripción cancelada — Acceso hasta ${fechaAcceso}`, type: "SUBSCRIPTION_CANCELED", status: "SENT" } });
    }
  } catch (e) { console.error("sendSubscriptionCanceledEmail error:", e); }
}

export async function sendPaymentFailedEmail(params: { toEmail: string; toName: string; orgName: string; planName: string }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">⚠️ Pago fallido</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, no pudimos procesar el pago de <strong>${params.orgName}</strong>.</p>
    <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #dc2626;">
      <p style="color:#991b1b;font-weight:bold;margin:0;font-size:15px;">Tu plan ${params.planName} fue suspendido temporalmente</p>
    </div>
    <p style="color:#555;font-size:14px;text-align:center;">Actualizá tu método de pago para restaurar el acceso.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/settings" style="background:#dc2626;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;">Actualizar pago →</a>
    </div>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: "⚠️ Pago fallido — Actualizá tu método de pago", html });
    const org = await prisma.organization.findFirst({ where: { email: params.toEmail }, select: { id: true } });
    if (org) {
      await prisma.emailLog.create({ data: { organizationId: org.id, to: params.toEmail, subject: "⚠️ Pago fallido — Actualizá tu método de pago", type: "PAYMENT_FAILED", status: "SENT" } });
    }
  } catch (e) { console.error("sendPaymentFailedEmail error:", e); }
}

export async function sendAffiliateCommissionEarnedEmail(params: { toEmail: string; toName: string; referredOrgName: string; commissionAmount: number; totalPending: number }) {
  try {
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">💰 ¡Ganaste una comisión!</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, <strong>${params.referredOrgName}</strong> activó su suscripción.</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #16a34a;">
      <p style="color:#166534;font-weight:bold;margin:0 0 6px;font-size:16px;">Comisión generada: $${params.commissionAmount.toFixed(2)} USD</p>
      <p style="color:#4ade80;margin:0;font-size:14px;">Total pendiente de cobro: $${params.totalPending.toFixed(2)} USD</p>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">Te avisaremos cuando procesemos el pago.</p>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: `💰 Nueva comisión — $${params.commissionAmount.toFixed(2)} USD de ${params.referredOrgName}`, html });
  } catch (e) { console.error("sendAffiliateCommissionEarnedEmail error:", e); }
}

export async function sendAffiliateCommissionPaidEmail(params: { toEmail: string; toName: string; amountPaid: number; paypalEmail: string | null }) {
  try {
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">✅ ¡Comisión pagada!</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, procesamos tu pago.</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #065f46;">
      <p style="color:#064e3b;font-weight:bold;margin:0 0 ${params.paypalEmail ? "6px" : "0"};font-size:16px;">Monto: $${params.amountPaid.toFixed(2)} USD</p>
      ${params.paypalEmail ? `<p style="color:#047857;margin:0;font-size:14px;">Enviado a: ${params.paypalEmail}</p>` : ""}
    </div>
    <p style="color:#555;font-size:14px;text-align:center;">Gracias por ser parte del programa de afiliados.</p>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: `✅ Pago de comisión procesado — $${params.amountPaid.toFixed(2)} USD`, html });
  } catch (e) { console.error("sendAffiliateCommissionPaidEmail error:", e); }
}

export async function sendRaffleWinnerEmail(params: {
  campaignId: string; toEmail: string; toName: string;
  prizeName: string; redemptionCode: string; expiresAt: Date;
  raffleTermsUrl?: string;
}) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { campaignId_type: { campaignId: params.campaignId, type: "RAFFLE_WINNER" } } });

    const redeemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/staff/redeem/${params.redemptionCode}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(redeemUrl)}`;
    const fechaVence = params.expiresAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

    let bodyText: string;
    let subject: string;

    if (template) {
      subject = template.subject;
      bodyText = template.bodyHtml
        .replace(/{{name}}/g, params.toName)
        .replace(/{{prize}}/g, params.prizeName)
        .replace(/{{redemptionCode}}/g, params.redemptionCode)
        .replace(/{{expiresAt}}/g, fechaVence);
    } else {
      subject = `🎲 ¡Ganaste en el sorteo! — ${params.prizeName}`;
      bodyText = `¡Felicitaciones ${params.toName}! Ganaste: ${params.prizeName}. Tu código de canje es: ${params.redemptionCode}. Tenés hasta el ${fechaVence} para reclamarlo.`;
    }

    const termsBlock = params.raffleTermsUrl
      ? `<div style="text-align:center;margin:10px 0;"><a href="${params.raffleTermsUrl}" style="color:#7C3AED;font-size:12px;">Ver términos y condiciones</a></div>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #7C3AED, #A78BFA); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎲 ¡Ganaste en el sorteo!</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px;">${bodyText}</p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">Tu código de canje</p>
        <p style="font-family: monospace; font-size: 22px; font-weight: bold; color: #7C3AED; letter-spacing: 3px;">${params.redemptionCode}</p>
        <p style="color: #999; font-size: 12px;">Válido hasta: ${fechaVence}</p>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">Mostrá este QR al empleado para canjear tu premio</p>
        <img src="${qrImageUrl}" alt="QR de canje" style="width: 200px; height: 200px; border-radius: 12px;"/>
      </div>
      ${termsBlock}
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject, html });
  } catch (e) { console.error("Email ganador sorteo error (no critico):", e); }
}

export async function sendPasswordResetEmail(params: { toEmail: string; toName: string; resetToken: string }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const resetUrl = `${appUrl}/reset-password?token=${params.resetToken}`;
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#7C3AED,#A78BFA);padding:32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;">🔐 Recuperar contraseña</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;">Hola <strong>${params.toName}</strong>, recibimos una solicitud para resetear tu contraseña.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:#7C3AED;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;">Cambiar contraseña →</a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;">Este link expira en 1 hora.</p>
    <p style="color:#bbb;font-size:12px;text-align:center;margin-top:8px;">Si no solicitaste esto, ignorá este email.</p>
  </div>
</div></body></html>`;
    await resend.emails.send({ from: "jugalo.app <noreply@jugalo.app>", to: params.toEmail, subject: "🔐 Recuperar contraseña — QR Juego", html });
  } catch (e) { console.error("sendPasswordResetEmail error:", e); }
}
