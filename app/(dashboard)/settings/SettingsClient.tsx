"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string; name: string; slug: string; price: number; yearlyPrice: number | null;
  trialDays: number; description: string | null;
  maxQrGames: number; maxScansPerQr: number; maxLeads: number;
  whiteLabelEnabled: boolean; webhooksEnabled: boolean; affiliatesEnabled: boolean;
  features: any;
}

interface Org {
  id: string; name: string; email: string; slug: string | null;
  subscriptionStatus: string; trialEndsAt: Date | null;
  whiteLabelEnabled: boolean; customDomain: string | null;
  logoUrl: string | null; primaryColor: string;
  contactName: string | null; contactWhatsapp: string | null; businessType: string | null;
}

interface Subscription {
  id: string; status: string; provider: string;
  currentPeriodEnd: Date | null; trialEnd: Date | null; canceledAt: Date | null;
}

interface Webhook {
  id: string; name: string; url: string; events: any; isActive: boolean;
  successCount: number; failureCount: number;
}

interface Props {
  org: Org;
  plan: Plan;
  webhooks: Webhook[];
  allPlans: Plan[];
  currentSubscription: Subscription | null;
}

export default function SettingsClient({ org, plan, webhooks, allPlans, currentSubscription }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"account" | "whitelabel" | "webhooks" | "plan">("account");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        {([
          { id: "account", label: "Cuenta" },
          { id: "plan", label: "Plan" },
          ...(plan.whiteLabelEnabled ? [{ id: "whitelabel", label: "White Label" }] : []),
          ...(plan.webhooksEnabled ? [{ id: "webhooks", label: "Webhooks" }] : []),
        ] as { id: string; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "account" && <AccountTab org={org} router={router} />}
      {tab === "plan" && (
        <PlanTab
          org={org}
          plan={plan}
          allPlans={allPlans}
          currentSubscription={currentSubscription}
          router={router}
        />
      )}
      {tab === "whitelabel" && plan.whiteLabelEnabled && <WhiteLabelTab org={org} router={router} />}
      {tab === "webhooks" && plan.webhooksEnabled && <WebhooksTab orgId={org.id} webhooks={webhooks} router={router} />}
    </div>
  );
}

// ─── Account Tab ─────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  "Restaurante",
  "Bar",
  "Comercio minorista",
  "Agencia de marketing",
  "Hotel",
  "Salud y bienestar",
  "Educación",
  "Otro",
];

function AccountTab({ org, router }: { org: Org; router: any }) {
  const [form, setForm] = useState({
    name: org.name,
    contactName: org.contactName ?? "",
    contactWhatsapp: org.contactWhatsapp ?? "",
    businessType: org.businessType ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setMsg("Guardado correctamente."); router.refresh(); }
    else setMsg("Error al guardar.");
  };

  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 space-y-4">
      <h2 className="font-semibold text-lg">Información de la cuenta</h2>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Nombre del negocio</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Email (no editable)</label>
          <input disabled value={org.email} className="w-full bg-gray-950 border border-white/10 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Nombre completo del responsable</label>
          <input
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            placeholder="Ej: Juan Pérez"
            className="w-full bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">WhatsApp de contacto</label>
          <input
            value={form.contactWhatsapp}
            onChange={(e) => setForm((f) => ({ ...f, contactWhatsapp: e.target.value }))}
            placeholder="+54 9 11 1234-5678"
            className="w-full bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Rubro del negocio</label>
          <select
            value={form.businessType}
            onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
            className="w-full bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Seleccioná un rubro</option>
            {BUSINESS_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>
        </div>
        {msg && <p className="text-sm text-green-400">{msg}</p>}
        <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

// ─── Plan Tab ─────────────────────────────────────────────────────────────────

type ConfirmAction = { type: "change"; plan: Plan } | { type: "cancel" };

function PlanTab({
  org, plan, allPlans, currentSubscription, router,
}: {
  org: Org; plan: Plan; allPlans: Plan[];
  currentSubscription: Subscription | null;
  router: any;
}) {
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [canceledUntil, setCanceledUntil] = useState<string | null>(null);

  const trialDaysLeft = org.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isCanceled = org.subscriptionStatus === "CANCELED";

  const formatDate = (d: Date | string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  };

  const execute = async () => {
    if (!confirm) return;
    setLoading(true);
    setMsg(null);

    const body = confirm.type === "cancel"
      ? { action: "cancel" }
      : { action: "change", planSlug: confirm.plan.slug };

    const res = await fetch("/api/settings/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    setConfirm(null);

    if (res.ok) {
      const data = await res.json();
      if (confirm.type === "cancel" && data.accessUntil) {
        setCanceledUntil(formatDate(data.accessUntil));
      }
      setMsg({ text: confirm.type === "cancel" ? "Suscripción cancelada." : "Plan actualizado correctamente.", type: "success" });
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg({ text: err.error ?? "Error al procesar el cambio.", type: "error" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Current status banner */}
      <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Plan actual</p>
            <h2 className="font-bold text-xl">{plan.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {plan.price === 0 ? "Gratis" : `$${plan.price} USD/mes`}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            org.subscriptionStatus === "TRIAL" ? "bg-yellow-500/20 text-yellow-300" :
            org.subscriptionStatus === "ACTIVE" ? "bg-green-500/20 text-green-300" :
            org.subscriptionStatus === "PAST_DUE" ? "bg-orange-500/20 text-orange-300" :
            "bg-red-500/20 text-red-300"
          }`}>
            {org.subscriptionStatus === "TRIAL" ? "Trial" :
             org.subscriptionStatus === "ACTIVE" ? "Activo" :
             org.subscriptionStatus === "PAST_DUE" ? "Pago pendiente" : "Cancelado"}
          </span>
        </div>

        {org.subscriptionStatus === "TRIAL" && trialDaysLeft !== null && (
          <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
            ⏳ Te quedan <strong>{trialDaysLeft} días</strong> de trial. Elegí un plan para continuar sin interrupciones.
          </div>
        )}

        {isCanceled && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
            Tu suscripción fue cancelada.
            {(canceledUntil ?? (currentSubscription?.currentPeriodEnd || currentSubscription?.trialEnd)) && (
              <> Tenés acceso hasta el <strong>
                {canceledUntil ?? formatDate(currentSubscription?.currentPeriodEnd ?? currentSubscription?.trialEnd ?? null)}
              </strong>.</>
            )}
          </div>
        )}

        {msg && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${
            msg.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-300" :
            "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}>
            {msg.text}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400 text-xs">QR Juegos</div>
            <div className="font-bold text-lg">{plan.maxQrGames}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400 text-xs">Escaneos/QR</div>
            <div className="font-bold text-lg">{plan.maxScansPerQr.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400 text-xs">Leads</div>
            <div className="font-bold text-lg">{plan.maxLeads >= 999999 ? "∞" : plan.maxLeads.toLocaleString()}</div>
          </div>
        </div>

        {(plan.whiteLabelEnabled || plan.webhooksEnabled || plan.affiliatesEnabled) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.whiteLabelEnabled && <span className="text-xs bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full">✓ White Label</span>}
            {plan.webhooksEnabled && <span className="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full">✓ Webhooks</span>}
            {plan.affiliatesEnabled && <span className="text-xs bg-green-600/20 text-green-300 px-3 py-1 rounded-full">✓ Afiliados</span>}
          </div>
        )}
      </div>

      {/* Available plans grid */}
      {!isCanceled && allPlans.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-3">Planes disponibles</h3>
          <div className="grid gap-3">
            {allPlans.map((p) => {
              const isCurrent = p.id === plan.id;
              const isUpgrade = p.price > plan.price;
              const isDowngrade = p.price < plan.price && p.price > 0;

              return (
                <div
                  key={p.id}
                  className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
                    isCurrent
                      ? "border-purple-500/60 bg-purple-900/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.name}</span>
                          {isCurrent && (
                            <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full">Plan actual</span>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                        )}
                        <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                          <span>{p.maxQrGames} juegos</span>
                          <span>·</span>
                          <span>{p.maxScansPerQr.toLocaleString()} escaneos</span>
                          <span>·</span>
                          <span>{p.maxLeads >= 999999 ? "∞" : p.maxLeads.toLocaleString()} leads</span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5">
                          {p.whiteLabelEnabled && <span className="text-xs bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded">White Label</span>}
                          {p.webhooksEnabled && <span className="text-xs bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded">Webhooks</span>}
                          {p.affiliatesEnabled && <span className="text-xs bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded">Afiliados</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {p.price === 0 ? "Gratis" : `$${p.price}`}
                        </div>
                        {p.price > 0 && <div className="text-xs text-gray-500">USD/mes</div>}
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => setConfirm({ type: "change", plan: p })}
                          className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            isUpgrade
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "bg-white/10 hover:bg-white/20 text-gray-200"
                          }`}
                        >
                          {isUpgrade ? "Subir plan" : isDowngrade ? "Bajar plan" : "Cambiar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel subscription */}
      {!isCanceled && org.subscriptionStatus !== "CANCELED" && (
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
          <h3 className="font-semibold text-red-400 mb-1">Cancelar suscripción</h3>
          <p className="text-sm text-gray-400 mb-3">
            Podés cancelar en cualquier momento. Mantendrás acceso hasta el fin del período actual.
          </p>
          <button
            onClick={() => setConfirm({ type: "cancel" })}
            className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-4 py-2 rounded-lg transition-colors"
          >
            Cancelar suscripción
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            {confirm.type === "cancel" ? (
              <>
                <h3 className="font-bold text-lg mb-2 text-red-400">¿Cancelar suscripción?</h3>
                <p className="text-sm text-gray-400 mb-5">
                  Tu cuenta pasará a estado cancelado. Mantendrás acceso hasta el fin del período actual y luego no podrás crear nuevos juegos.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-2">
                  {confirm.plan.price > plan.price ? "Subir" : "Cambiar"} al plan {confirm.plan.name}
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  Pasarás del plan <strong>{plan.name}</strong> al plan <strong>{confirm.plan.name}</strong>
                  {confirm.plan.price > 0 ? ` ($${confirm.plan.price} USD/mes)` : " (Gratis)"}.
                </p>
                <p className="text-xs text-gray-500 mb-5">
                  El cambio se aplica de inmediato. El cobro se ajustará en tu próximo ciclo de facturación.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={loading}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={execute}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
                  confirm.type === "cancel"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {loading ? "Procesando..." : confirm.type === "cancel" ? "Sí, cancelar" : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── White Label Tab ──────────────────────────────────────────────────────────

function WhiteLabelTab({ org, router }: { org: Org; router: any }) {
  const [form, setForm] = useState({
    logoUrl: org.logoUrl ?? "",
    primaryColor: org.primaryColor ?? "#7C3AED",
    customDomain: org.customDomain ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings/whitelabel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setMsg("White label actualizado."); router.refresh(); }
    else setMsg("Error al guardar.");
  };

  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 space-y-4">
      <h2 className="font-semibold text-lg">White Label</h2>
      <p className="text-sm text-gray-400">Personalizá el branding de tus juegos QR.</p>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">URL del logo</label>
          <input
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Color primario</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              className="w-12 h-10 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              className="flex-1 bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Dominio personalizado</label>
          <input
            value={form.customDomain}
            onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
            placeholder="juegos.tunegocio.com"
            className="w-full bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">Configurá un CNAME apuntando a qrjuego.com en tu DNS.</p>
        </div>
        {msg && <p className="text-sm text-green-400">{msg}</p>}
        <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium">
          {saving ? "Guardando..." : "Guardar white label"}
        </button>
      </form>
    </div>
  );
}

// ─── Webhooks Tab ─────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  { id: "lead.created", label: "Lead creado" },
  { id: "winner.created", label: "Ganador generado" },
  { id: "winner.major", label: "Premio mayor ganado" },
  { id: "winner.consolation", label: "Premio consuelo entregado" },
  { id: "prize.redeemed", label: "Premio canjeado" },
  { id: "campaign.activated", label: "Campaña activada" },
  { id: "upsell.clicked", label: "Click en upseller" },
  { id: "subscription.trial_started", label: "Trial iniciado" },
  { id: "subscription.trial_ending", label: "Trial por vencer (3 días)" },
  { id: "subscription.activated", label: "Suscripción activada" },
  { id: "subscription.cancelled", label: "Suscripción cancelada" },
];

function WebhooksTab({ orgId, webhooks, router }: { orgId: string; webhooks: Webhook[]; router: any }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const toggleEvent = (ev: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", url: "", events: [] });
    router.refresh();
  };

  const deleteWebhook = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/settings/webhooks/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg">Webhooks</h2>
          <p className="text-sm text-gray-400">Conectá QR Juego con Make, Zapier o tu propio backend.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Nuevo webhook
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-5">
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nombre</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                  className="w-full bg-gray-950 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">URL del endpoint</label>
                <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} required type="url"
                  placeholder="https://hook.make.com/..."
                  className="w-full bg-gray-950 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">Eventos a escuchar</label>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => toggleEvent(ev.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.events.includes(ev.id)
                        ? "border-purple-500 bg-purple-600/20 text-purple-300"
                        : "border-white/20 text-gray-400 hover:border-white/40"
                    }`}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm">Cancelar</button>
              <button type="submit" disabled={saving || form.events.length === 0} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium">
                {saving ? "Creando..." : "Crear webhook"}
              </button>
            </div>
          </form>
        </div>
      )}

      {webhooks.length === 0 && !showForm && (
        <div className="bg-gray-900 border border-white/10 rounded-xl p-8 text-center text-gray-500">
          No hay webhooks configurados.
        </div>
      )}

      {webhooks.map((wh) => (
        <div key={wh.id} className="bg-gray-900 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{wh.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-mono">{wh.url}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(wh.events as string[]).map((ev) => (
                  <span key={ev} className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded">{ev}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-400">✓ {wh.successCount}</span>
              <span className="text-red-400">✗ {wh.failureCount}</span>
              <button
                onClick={() => deleteWebhook(wh.id)}
                disabled={deleting === wh.id}
                className="text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {deleting === wh.id ? "..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
