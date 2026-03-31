import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";

const schema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

export async function GET() {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (payload as any).organizationId;
  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(webhooks);
}

export async function POST(req: Request) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (payload as any).organizationId;
  const org = await prisma.organization.findUnique({ where: { id: orgId }, include: { plan: true } });
  if (!org?.plan.webhooksEnabled) {
    return NextResponse.json({ error: "Tu plan no incluye webhooks." }, { status: 403 });
  }

  const body = schema.parse(await req.json());
  const webhook = await prisma.webhookEndpoint.create({
    data: {
      organizationId: orgId,
      name: body.name,
      url: body.url,
      events: body.events,
      secret: nanoid(32),
      isActive: true,
    },
  });
  return NextResponse.json(webhook, { status: 201 });
}
