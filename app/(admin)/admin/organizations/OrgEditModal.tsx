"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan { id: string; name: string }

interface Props {
  org: {
    id: string;
    name: string;
    planId: string;
    subscriptionStatus: string;
    isActive: boolean;
    contactName: string | null;
    contactWhatsapp: string | null;
    businessType: string | null;
  };
  plans: Plan[];
}

const SUBSCRIPTION_STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED", "SUSPENDED"];
const BUSINESS_TYPES = [
  "Restaurante", "Bar", "Comercio minorista", "Agencia de marketing",
  "Hotel", "Salud y bienestar", "Educación", "Otro",
];

export default function OrgEditModal({ org, plans }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: org.name,
    planId: org.planId,
    subscriptionStatus: org.subscriptionStatus,
    isActive: org.isActive,
    contactName: org.contactName ?? "",
    contactWhatsapp: org.contactWhatsapp ?? "",
    businessType: org.businessType ?? "",
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/organizations/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contactName: form.contactName || null,
        contactWhatsapp: form.contactWhatsapp || null,
        businessType: form.businessType || null,
      }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-medium text-white hover:text-purple-300 transition-colors text-left"
      >
        {org.name}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#1a1a2e] border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4">Editar organización</h3>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nombre del negocio</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Plan</label>
                  <select
                    value={form.planId}
                    onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
                    className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Estado de pago</label>
                  <select
                    value={form.subscriptionStatus}
                    onChange={(e) => setForm((f) => ({ ...f, subscriptionStatus: e.target.value }))}
                    className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {SUBSCRIPTION_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nombre del responsable</label>
                <input
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="Juan Pérez"
                  className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">WhatsApp de contacto</label>
                <input
                  value={form.contactWhatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, contactWhatsapp: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Rubro</label>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
                  className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Sin especificar</option>
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="accent-purple-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">Cuenta activa</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
