import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

function getSession() {
  const token = cookies().get("auth-token")?.value;
  return token ? verifyToken(token) : null;
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session as any).organizationId;
  const pins = await prisma.staffPin.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(pins);
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session as any).organizationId;
  const { staffName, pin } = await req.json();
  if (!staffName || !pin) return NextResponse.json({ error: "Nombre y PIN son requeridos" }, { status: 400 });
  if (!/^\d{6}$/.test(pin)) return NextResponse.json({ error: "El PIN debe ser de 6 dígitos numéricos" }, { status: 400 });
  const existing = await prisma.staffPin.findUnique({ where: { organizationId_pin: { organizationId, pin } } });
  if (existing) return NextResponse.json({ error: "Ya existe un staff con ese PIN" }, { status: 409 });
  const newPin = await prisma.staffPin.create({ data: { organizationId, staffName, pin } });
  return NextResponse.json(newPin);
}

export async function DELETE(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session as any).organizationId;
  const { pinId } = await req.json();
  await prisma.staffPin.updateMany({ where: { id: pinId, organizationId }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
