"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  name: string; slug: string; price: number; trialDays: number;
  maxQrGames: number; maxScansPerQr: number; maxLeads: number;
  whiteLabelEnabled: boolean; webhooksEnabled: boolean; affiliatesEnabled: boolean;
  features: any;
}

interface Org {
  id: string; name: string; email: string; slug: string | null;
  subscriptionStatus: string; trialEndsAt: Date | null;
  whiteLabelEnabled: boolean; customDomain: string | null;
  logoUrl: string | null; primaryColor: string;
}

interface Webhook {
  id: string; name: string; url: string; events: any; isActive: boolean;
  successCount: number; failureCount: number;
}

interface Props { org: Org; plan: Plan; webhooks: Webhook[] }

export default function SettingsClient({ org, plan, webhooks }: Props) {
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
      {tab === "plan" && <PlanTab org={org} plan={plan} />}
      {tab === "whitelabel" && plan.whiteLabelEnabled && <WhiteLabelTab org={org} router={router} />}
      {tab === "webhooks" && plan.webhooksEnabled && <WebhooksTab orgId={org.id} webhooks={webhooks} router={router} />}
    </div>
  );
}

// ─── Account Tab ─────────────────────────────────────────────────────────────

function AccountTab({ org, router }: { org: Org; router: any }) {
  const [form, setForm] = useState({ name: org.name });
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
            onChange={(e) => setForm({ name: e.target.value })}
            className="w-full bg-gray-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Email (no editable)</label>
          <input disabled value={org.email} className="w-full bg-gray-950 border border-white/10 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed" />
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

function PlanTab({ org, plan }: { org: Org; plan: Plan }) {
  const trialDaysLeft = org.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-lg">Plan {plan.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {plan.price === 0 ? "Gratis" : `$${plan.price}/mes`}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full ${
            org.subscriptionStatus === "TRIAL" ? "bg-yellow-500/20 text-yellow-300" :
            org.subscriptionStatus === "ACTIVE" ? "bg-green-500/20 text-green-300" :
            "bg-red-500/20 text-red-300"
          }`}>
            {org.subscriptionStatus}
          </span>
        </div>

        {org.subscriptionStatus === "TRIAL" && trialDaysLeft !== null && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
            ⏳ Te quedan <strong>{trialDaysLeft} días</strong> de trial. Actualiza tu plan para continuar sin interrupciones.
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400">QR Juegos</div>
            <div className="font-bold text-lg">{plan.maxQrGames}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400">Escaneos/QR</div>
            <div className="font-bold text-lg">{plan.maxScansPerQr.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400">Leads</div>
            <div className="font-bold text-lg">{plan.maxLeads >= 999999 ? "∞" : plan.maxLeads.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {plan.whiteLabelEnabled && <span className="text-xs bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full">✓ White Label</span>}
          {plan.webhooksEnabled && <span className="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full">✓ Webhooks</span>}
          {plan.affiliatesEnabled && <span className="text-xs bg-green-600/20 text-green-300 px-3 py-1 rounded-full">✓ Afiliados</span>}
        </div>
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold mb-3">¿Necesitás más?</h3>
        <p className="text-sm text-gray-400 mb-4">Contactanos para actualizar tu plan o conocer opciones Enterprise.</p>
        <a
          href="mailto:hola@qrjuego.com?subject=Quiero actualizar mi plan"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2 rounded-lg transition-colors"
        >
          Contactar ventas →
        </a>
      </div>
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
  { id: "prize.redeemed", label: "Premio canjeado" },
  { id: "campaign.activated", label: "Campaña activada" },
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
