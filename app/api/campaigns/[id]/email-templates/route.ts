import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emailTemplateSchema } from "@/lib/validations";
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const parsed = emailTemplateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  for (const t of parsed.data) { await prisma.emailTemplate.upsert({ where: { campaignId_type: { campaignId: params.id, type: t.type } }, update: { subject: t.subject, bodyHtml: t.bodyHtml }, create: { campaignId: params.id, type: t.type, subject: t.subject, bodyHtml: t.bodyHtml } }); }
  return NextResponse.json({ success: true });
}
