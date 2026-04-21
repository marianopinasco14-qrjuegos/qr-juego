export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function UpgradePage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Elegí tu plan</h1>
          <p className="text-gray-400 text-lg">14 días gratis en todos los planes. Sin tarjeta de crédito.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const isPopular = plan.slug === "growth";
            const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 border ${
                  isPopular
                    ? "border-purple-500 bg-purple-900/20 relative"
                    : "border-white/10 bg-[#1a1a2e]"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                    Más popular
                  </div>
                )}
                <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                {plan.description && <p className="text-gray-400 text-sm mb-4">{plan.description}</p>}
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price === 0 ? "Gratis" : `$${plan.price}`}</span>
                  {plan.price > 0 && <span className="text-gray-400">/mes</span>}
                  {plan.yearlyPrice > 0 && (
                    <div className="text-sm text-green-400 mt-1">
                      o ${plan.yearlyPrice}/año — 2 meses gratis
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                  {plan.whiteLabelEnabled && (
                    <li className="flex items-center gap-2 text-sm text-purple-300">
                      <span>✓</span> White Label
                    </li>
                  )}
                  {plan.webhooksEnabled && (
                    <li className="flex items-center gap-2 text-sm text-blue-300">
                      <span>✓</span> Webhooks (Make/Zapier)
                    </li>
                  )}
                  {plan.affiliatesEnabled && (
                    <li className="flex items-center gap-2 text-sm text-green-300">
                      <span>✓</span> Módulo afiliados
                    </li>
                  )}
                </ul>

                <Link
                  href={plan.price === 0 ? "/register" : `/api/billing/checkout?planId=${plan.id}`}
                  className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                    isPopular
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {plan.price === 0 ? "Empezar gratis" : `Empezar trial gratis →`}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 space-y-2">
          <p>🔒 Pagos procesados con Paddle (internacional) o Dlocal (LATAM)</p>
          <p>Aceptamos tarjetas, transferencias, PIX, PSE y más métodos locales</p>
          <p>Podés cancelar en cualquier momento — sin costos ocultos</p>
        </div>
      </div>
    </div>
  );
}
