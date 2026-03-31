import { prisma } from "@/lib/prisma";
import PlanForm from "./PlanForm";

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planes ({plans.length})</h1>
        <PlanForm mode="create" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <code className="text-xs text-gray-500">{plan.slug}</code>
              </div>
              <div className="flex gap-2 items-center">
                {!plan.isActive && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Inactivo</span>
                )}
                {!plan.isPublic && (
                  <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded">Oculto</span>
                )}
                <PlanForm mode="edit" plan={plan} />
              </div>
            </div>
            {plan.description && <p className="text-sm text-gray-400 mb-3">{plan.description}</p>}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Precio mensual</span>
                <span className="font-semibold">{plan.price === 0 ? "Gratis" : `$${plan.price}/mes`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precio anual</span>
                <span>{plan.yearlyPrice === 0 ? "—" : `$${plan.yearlyPrice}/año`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trial</span>
                <span>{plan.trialDays} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">QR Games</span>
                <span>{plan.maxQrGames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Escaneos/QR</span>
                <span>{plan.maxScansPerQr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Leads máx.</span>
                <span>{plan.maxLeads >= 999999 ? "∞" : plan.maxLeads.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex gap-2 flex-wrap text-xs">
              {plan.whiteLabelEnabled && <span className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded">White Label</span>}
              {plan.webhooksEnabled && <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded">Webhooks</span>}
              {plan.affiliatesEnabled && <span className="bg-green-600/20 text-green-300 px-2 py-0.5 rounded">Afiliados</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
