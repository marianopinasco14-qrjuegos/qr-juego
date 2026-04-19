import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
    });

    if (!tokenRecord || tokenRecord.usedAt !== null) {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }

    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "El link expiró. Solicitá uno nuevo." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: tokenRecord.email } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: tokenRecord.email },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
