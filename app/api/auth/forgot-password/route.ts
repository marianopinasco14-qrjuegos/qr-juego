import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const { email } = body;

    const user = await prisma.user.findUnique({ where: { email }, select: { name: true } });
    if (!user) {
      // No revelar si el email existe
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({ data: { email, token, expiresAt } });

    // Eliminar tokens anteriores no usados para este email
    await prisma.passwordResetToken.deleteMany({
      where: { email, usedAt: null, expiresAt: { gt: new Date() }, NOT: { token } },
    });

    await sendPasswordResetEmail({ toEmail: email, toName: user.name ?? email, resetToken: token });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }
    console.error("[forgot-password]", e);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
