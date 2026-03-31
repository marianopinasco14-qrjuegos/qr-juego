import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (payload as any).organizationId;
  const wh = await prisma.webhookEndpoint.findFirst({ where: { id: params.id, organizationId: orgId } });
  if (!wh) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = schema.parse(await req.json());
  const updated = await prisma.webhookEndpoint.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (payload as any).organizationId;
  const wh = await prisma.webhookEndpoint.findFirst({ where: { id: params.id, organizationId: orgId } });
  if (!wh) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.webhookEndpoint.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
