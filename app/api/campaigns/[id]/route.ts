import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, organizationId }, include: { prizes: true, consolePrize: true, emailTemplates: true, _count: { select: { leads: true, scans: true } } } });
  if (!campaign) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(campaign);
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  const body = await req.json();
  const existing = await prisma.campaign.findFirst({ where: { id: params.id, organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const updated = await prisma.campaign.update({ where: { id: params.id }, data: { ...body, formFields: body.formFields ? JSON.stringify(body.formFields) : undefined, updatedAt: new Date() } });
  return NextResponse.json(updated);
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  await prisma.campaign.deleteMany({ where: { id: params.id, organizationId } });
  return NextResponse.json({ success: true });
}
