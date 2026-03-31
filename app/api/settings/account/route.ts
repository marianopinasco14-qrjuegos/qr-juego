import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(2).max(100) });

export async function PATCH(req: Request) {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = schema.parse(await req.json());
  const org = await prisma.organization.update({
    where: { id: (payload as any).organizationId },
    data: { name: body.name },
  });
  return NextResponse.json(org);
}
