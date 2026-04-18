import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const token = cookies().get("auth-token")?.value;
  if (!token) redirect("/login");
  const payload = verifyToken(token) as any;
  if (!payload) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: payload.organizationId },
    include: { plan: true, subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!org) redirect("/login");

  const [webhooks, allPlans] = await Promise.all([
    prisma.webhookEndpoint.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      where: { isPublic: true, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const currentSubscription = org.subscriptions[0] ?? null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <SettingsClient
        org={org}
        plan={org.plan}
        webhooks={webhooks}
        allPlans={allPlans}
        currentSubscription={currentSubscription}
        pixels={{
          metaPixelId: org.metaPixelId ?? null,
          googleAnalyticsId: org.googleAnalyticsId ?? null,
          tiktokPixelId: org.tiktokPixelId ?? null,
        }}
      />
    </div>
  );
}
