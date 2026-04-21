import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const SECRET = process.env.NEXTAUTH_SECRET || "qrjuego-secret-key-2024";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix++;
  }
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_denied`);
  }

  // Intercambiar code por access_token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/login?error=google_token_failed`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Obtener info del usuario de Google
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userInfoRes.ok) {
    return NextResponse.redirect(`${appUrl}/login?error=google_userinfo_failed`);
  }

  const googleUser: { id: string; email: string; name: string; picture?: string } = await userInfoRes.json();

  if (!googleUser.email) {
    return NextResponse.redirect(`${appUrl}/login?error=google_no_email`);
  }

  // Buscar usuario existente por email
  let user = await prisma.user.findUnique({
    where: { email: googleUser.email },
    include: { organization: true },
  });

  if (!user) {
    // Primer acceso con Google → crear org + usuario
    const plan = await prisma.plan.findFirst({ where: { slug: "starter", isActive: true } });
    if (!plan) {
      return NextResponse.redirect(`${appUrl}/login?error=plan_not_found`);
    }

    const trialEndsAt = new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000);
    const orgName = `${googleUser.name} - Negocio`;
    const orgSlug = await uniqueSlug(orgName);
    const fakePasswordHash = await bcrypt.hash(nanoid(24), 10);

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
          email: googleUser.email,
          planId: plan.id,
          subscriptionStatus: "TRIAL",
          trialEndsAt,
          isActive: true,
          contactName: googleUser.name,
        },
      });

      const newUser = await tx.user.create({
        data: {
          organizationId: org.id,
          email: googleUser.email,
          passwordHash: fakePasswordHash,
          name: googleUser.name,
          role: "OWNER",
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          status: "TRIAL",
          trialStart: new Date(),
          trialEnd: trialEndsAt,
        },
      });

      return { org, user: newUser };
    });

    user = { ...result.user, organization: result.org } as any;

    await prisma.emailLog.create({
      data: {
        organizationId: result.org.id,
        to: googleUser.email,
        subject: `¡Bienvenido a QR Juego! Tu trial de ${plan.trialDays} días ya está activo`,
        type: "TRIAL_STARTED",
        status: "SENT",
      },
    });
  } else if (!user.organization?.isActive) {
    return NextResponse.redirect(`${appUrl}/login?error=account_suspended`);
  }

  // Emitir JWT propio (mismo sistema que el login manual)
  if (!user) return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    },
    SECRET,
    { expiresIn: "7d" }
  );

  const response = NextResponse.redirect(`${appUrl}/dashboard`);
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
