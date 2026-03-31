"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Affiliate {
  id: string; name: string; email: string; code: string;
  commissionRate: number; status: string; paypalEmail: string | null; notes: string | null;
}

interface Props { mode: "create" | "edit"; affiliate?: Affiliate }

const defaults = { name: "", email: "", code: "", commissionRate: 20, status: "PENDING", paypalEmail: "", notes: "" };

export default function AffiliateForm({ mode, affiliate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(
    mode === "edit" && affiliate
      ? { ...affiliate, paypalEmail: affiliate.paypalEmail ?? "", notes: affiliate.notes ?? "" }
      : defaults
  );

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const body = { ...form, commissionRate: Number(form.commissionRate), code: (form.code as string).toUpperCase() };
    const url = mode === "edit" ? `/api/admin/affiliates/${affiliate!.id}` : "/api/admin/affiliates";
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
      <button onClick={() => setOpen(true)}
        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
          mode === "create" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-white/10 hover:bg-white/20 text-gray-300"
        }`}>
        {mode === "create" ? "+ Nuevo afiliado" : "Editar"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{mode === "create" ? "Nuevo afiliado" : `Editar: ${affiliate?.name}`}</h2>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">Nombre</span>
                  <input name="name" value={form.name} onChange={handle} required
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Email</span>
                  <input name="email" type="email" value={form.email} onChange={handle} required
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">Código referido</span>
                  <input name="code" value={form.code} onChange={handle} required
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Comisión %</span>
                  <input name="commissionRate" type="number" min="0" max="100" value={form.commissionRate} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-gray-400">Estado</span>
                <select name="status" value={form.status} onChange={handle}
                  className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
                  <option value="PENDING">Pendiente</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-gray-400">PayPal email (para pagos)</span>
                <input name="paypalEmail" type="email" value={form.paypalEmail} onChange={handle}
                  className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400">Notas</span>
                <textarea name="notes" value={form.notes} onChange={handle} rows={2}
                  className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
              </label>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-semibold">
                  {loading ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
