import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  metaPixelId: z.string().max(50).optional().nullable(),
  googleAnalyticsId: z.string().max(50).optional().nullable()
    .refine((val) => !val || val.startsWith("G-"), { message: "El ID de GA4 debe empezar con G-" }),
  tiktokPixelId: z.string().max(50).optional().nullable(),
});

export async function GET() {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: (payload as any).organizationId },
    select: { metaPixelId: true, googleAnalyticsId: true, tiktokPixelId: true },
  });
  return NextResponse.json(org);
}

export async function PATCH(req: Request) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const org = await prisma.organization.update({
    where: { id: (payload as any).organizationId },
    data: {
      metaPixelId: body.metaPixelId ?? null,
      googleAnalyticsId: body.googleAnalyticsId ?? null,
      tiktokPixelId: body.tiktokPixelId ?? null,
    },
    select: { metaPixelId: true, googleAnalyticsId: true, tiktokPixelId: true },
  });
  return NextResponse.json({ success: true, ...org });
}
