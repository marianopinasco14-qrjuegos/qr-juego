import { prisma } from "./prisma";
import crypto from "crypto";

export type WebhookEventType =
  | "lead.created"
  | "winner.created"
  | "winner.major"
  | "winner.consolation"
  | "prize.redeemed"
  | "campaign.activated"
  | "upsell.clicked"
  | "subscription.created"
  | "subscription.canceled"
  | "subscription.trial_started"
  | "subscription.trial_ending"
  | "subscription.activated"
  | "subscription.cancelled";

interface WebhookPayload {
  event: WebhookEventType;
  organizationId: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Dispara un evento a todos los webhooks activos de la organización
 * que tienen el evento suscripto. Fire-and-forget: no bloquea.
 */
export function dispatchWebhook(
  organizationId: string,
  event: WebhookEventType,
  data: Record<string, any>
): void {
  // No awaiteamos — se ejecuta en background
  _dispatch(organizationId, event, data).catch((err) =>
    console.error("[webhook dispatch error]", err)
  );
}

async function _dispatch(
  organizationId: string,
  event: WebhookEventType,
  data: Record<string, any>
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { organizationId, isActive: true },
  });

  const payload: WebhookPayload = {
    event,
    organizationId,
    timestamp: new Date().toISOString(),
    data,
  };
  const payloadStr = JSON.stringify(payload);

  await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      const events = endpoint.events as string[];
      if (!events.includes(event)) return;

      const signature = crypto
        .createHmac("sha256", endpoint.secret)
        .update(payloadStr)
        .digest("hex");

      const start = Date.now();
      let success = false;
      let responseStatus: number | null = null;
      let responseBody: string | null = null;

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-QRJuego-Signature": `sha256=${signature}`,
            "X-QRJuego-Event": event,
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10_000), // 10s timeout
        });
        responseStatus = res.status;
        responseBody = await res.text().catch(() => null);
        success = res.ok;
      } catch (err: any) {
        responseBody = err.message;
      }

      const durationMs = Date.now() - start;

      // Loguear el intento
      await prisma.webhookLog.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: payload as any,
          responseStatus,
          responseBody: responseBody?.slice(0, 500),
          durationMs,
          success,
        },
      });

      // Actualizar contadores en el endpoint
      await prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: {
          lastTriggeredAt: new Date(),
          successCount: success ? { increment: 1 } : undefined,
          failureCount: !success ? { increment: 1 } : undefined,
        },
      });
    })
  );
}
