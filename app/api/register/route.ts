import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2).max(100),
  couponCode: z.string().optional(),
  referralCode: z.string().optional(),
});

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Email ya registrado?
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: "Este email ya está registrado." }, { status: 409 });
    }

    // Plan Starter por defecto (trial gratuito)
    const plan = await prisma.plan.findFirst({ where: { slug: "starter", isActive: true } });
    if (!plan) {
      return NextResponse.json({ error: "Plan no disponible." }, { status: 500 });
    }

    // Validar cupón si viene
    let coupon = null;
    if (data.couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: data.couponCode.toUpperCase(),
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
        },
      });
      if (!coupon) {
        return NextResponse.json({ error: "Cupón inválido o expirado." }, { status: 400 });
      }
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "El cupón ya alcanzó su límite de usos." }, { status: 400 });
      }
    }

    // Validar código de afiliado
    let affiliate = null;
    if (data.referralCode) {
      affiliate = await prisma.affiliate.findFirst({
        where: { code: data.referralCode.toUpperCase(), status: "ACTIVE" },
      });
    }

    const trialDays = plan.trialDays;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const orgSlug = await uniqueSlug(data.orgName);

    // Crear organización + usuario + suscripción en transacción
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.orgName,
          slug: orgSlug,
          email: data.email,
          planId: plan.id,
          subscriptionStatus: "TRIAL",
          trialEndsAt,
          isActive: true,
          referredByCode: data.referralCode?.toUpperCase() ?? null,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: data.email,
          passwordHash,
          name: data.name,
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
          couponId: coupon?.id ?? null,
        },
      });

      // Registrar uso del cupón
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUse.create({
          data: { couponId: coupon.id, organizationId: org.id },
        });
      }

      // Registrar referido de afiliado
      if (affiliate) {
        await tx.affiliateReferral.create({
          data: {
            affiliateId: affiliate.id,
            referredOrganizationId: org.id,
            commissionAmount: 0,
            commissionStatus: "PENDING",
          },
        });
        await tx.affiliate.update({
          where: { id: affiliate.id },
          data: { totalReferrals: { increment: 1 } },
        });
      }

      return { org, user };
    });

    // Log email de bienvenida (envío real se puede agregar con Resend)
    await prisma.emailLog.create({
      data: {
        organizationId: result.org.id,
        to: data.email,
        subject: `¡Bienvenido a QR Juego! Tu trial de ${trialDays} días ya está activo`,
        type: "TRIAL_STARTED",
        status: "SENT",
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Cuenta creada. Tu trial de ${trialDays} días está activo.`,
      trialEndsAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos.", details: err.flatten() }, { status: 400 });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
