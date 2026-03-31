"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Coupon {
  id: string; code: string; description: string | null;
  type: string; value: number; currency: string;
  maxUses: number | null; validUntil: Date | null; isActive: boolean;
}

interface Props { mode: "create" | "edit"; coupon?: Coupon }

const defaults = { code: "", description: "", type: "PERCENTAGE", value: 20, currency: "USD", maxUses: "", validUntil: "", isActive: true };

export default function CouponForm({ mode, coupon }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(
    mode === "edit" && coupon
      ? {
          ...coupon,
          maxUses: coupon.maxUses?.toString() ?? "",
          validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split("T")[0] : "",
        }
      : defaults
  );

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      value: Number(form.value),
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      validUntil: form.validUntil || null,
      code: (form.code as string).toUpperCase(),
    };
    const url = mode === "edit" ? `/api/admin/coupons/${coupon!.id}` : "/api/admin/coupons";
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
        {mode === "create" ? "+ Nuevo cupón" : "Editar"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{mode === "create" ? "Nuevo cupón" : `Editar: ${coupon?.code}`}</h2>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">Código</span>
                  <input name="code" value={form.code as string} onChange={handle} required
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Tipo</span>
                  <select name="type" value={form.type as string} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
                    <option value="PERCENTAGE">Porcentaje</option>
                    <option value="FIXED">Fijo</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-gray-400">Descripción</span>
                <input name="description" value={form.description as string} onChange={handle}
                  className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">{form.type === "PERCENTAGE" ? "Descuento %" : "Monto"}</span>
                  <input name="value" type="number" step="0.01" value={form.value} onChange={handle} required
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Usos máx. (vacío=∞)</span>
                  <input name="maxUses" type="number" value={form.maxUses as string} onChange={handle}
                    className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-gray-400">Válido hasta (vacío=sin límite)</span>
                <input name="validUntil" type="date" value={form.validUntil as string} onChange={handle}
                  className="w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive as boolean} onChange={handle} className="w-4 h-4 accent-purple-500" />
                <span className="text-sm text-gray-300">Activo</span>
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
