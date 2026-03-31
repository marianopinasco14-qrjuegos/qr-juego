import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  customDomain: z.string().optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (payload as any).organizationId;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { plan: true },
  });
  if (!org?.plan.whiteLabelEnabled) {
    return NextResponse.json({ error: "Tu plan no incluye white label." }, { status: 403 });
  }

  const body = schema.parse(await req.json());
  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor,
      customDomain: body.customDomain || null,
    },
  });
  return NextResponse.json(updated);
}
