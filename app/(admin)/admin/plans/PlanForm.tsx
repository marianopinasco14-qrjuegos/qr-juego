"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string; slug: string; name: string; description: string | null;
  price: number; yearlyPrice: number; trialDays: number;
  maxQrGames: number; maxScansPerQr: number; maxLeads: number;
  whiteLabelEnabled: boolean; webhooksEnabled: boolean; affiliatesEnabled: boolean;
  isPublic: boolean; isActive: boolean; sortOrder: number;
  features: any;
}

interface Props {
  mode: "create" | "edit";
  plan?: Plan;
}

const defaults = {
  slug: "", name: "", description: "", price: 0, yearlyPrice: 0, trialDays: 14,
  maxQrGames: 2, maxScansPerQr: 500, maxLeads: 1000,
  whiteLabelEnabled: false, webhooksEnabled: false, affiliatesEnabled: false,
  isPublic: true, isActive: true, sortOrder: 0, features: "",
};

export default function PlanForm({ mode, plan }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(
    mode === "edit" && plan
      ? { ...plan, features: Array.isArray(plan.features) ? (plan.features as string[]).join("\n") : "" }
      : defaults
  );

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const v = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((f) => ({ ...f, [name]: v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const body = {
      ...form,
      price: Number(form.price),
      yearlyPrice: Number(form.yearlyPrice),
      trialDays: Number(form.trialDays),
      maxQrGames: Number(form.maxQrGames),
      maxScansPerQr: Number(form.maxScansPerQr),
      maxLeads: Number(form.maxLeads),
      sortOrder: Number(form.sortOrder),
      features: (form.features as string).split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const url = mode === "edit" ? `/api/admin/plans/${plan!.id}` : "/api/admin/plans";
    const method = mode === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setLoading(false); return; }
    setOpen(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
          mode === "create"
            ? "bg-purple-600 hover:bg-purple-700 text-white"
            : "bg-white/10 hover:bg-white/20 text-gray-300"
        }`}
      >
        {mode === "create" ? "+ Nuevo plan" : "Editar"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{mode === "create" ? "Nuevo plan" : `Editar: ${plan?.name}`}</h2>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">Slug</span>
                  <input name="slug" value={form.slug} onChange={handle} required
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Nombre</span>
                  <input name="name" value={form.name} onChange={handle} required
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-gray-400">Descripción</span>
                <input name="description" value={form.description ?? ""} onChange={handle}
                  className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">Precio/mes USD</span>
                  <input name="price" type="number" step="0.01" value={form.price} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Precio anual USD</span>
                  <input name="yearlyPrice" type="number" step="0.01" value={form.yearlyPrice} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Trial (días)</span>
                  <input name="trialDays" type="number" value={form.trialDays} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">QR Games</span>
                  <input name="maxQrGames" type="number" value={form.maxQrGames} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Escaneos/QR</span>
                  <input name="maxScansPerQr" type="number" value={form.maxScansPerQr} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Max Leads</span>
                  <input name="maxLeads" type="number" value={form.maxLeads} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-gray-400">Features (una por línea)</span>
                <textarea name="features" value={form.features as string} onChange={handle} rows={4}
                  className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder={"5 juegos QR\n2.000 escaneos\nWebhooks"} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "whiteLabelEnabled", label: "White Label" },
                  { name: "webhooksEnabled", label: "Webhooks" },
                  { name: "affiliatesEnabled", label: "Afiliados" },
                  { name: "isPublic", label: "Visible en pricing" },
                  { name: "isActive", label: "Activo" },
                ].map((cb) => (
                  <label key={cb.name} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name={cb.name} checked={!!(form as any)[cb.name]} onChange={handle}
                      className="w-4 h-4 accent-purple-500" />
                    <span className="text-sm text-gray-300">{cb.label}</span>
                  </label>
                ))}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-semibold">
                  {loading ? "Guardando..." : mode === "create" ? "Crear plan" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
