"use client";
import { useState, useEffect } from "react";

export default function StaffPinsPage() {
  const [pins, setPins] = useState<any[]>([]);
  const [orgId, setOrgId] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetch("/api/staff-pins")
      .then(r => r.json())
      .then(data => { setPins(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => setOrgId(data?.organizationId || ""))
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/staff-pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffName, pin }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error al crear"); setSaving(false); return; }
    setPins(p => [data, ...p]);
    setStaffName(""); setPin(""); setShowForm(false);
    setSaving(false);
  }

  async function handleDeactivate(pinId: string) {
    await fetch("/api/staff-pins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId }),
    });
    setPins(p => p.map(item => item.id === pinId ? { ...item, isActive: false } : item));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Staff PINs</h1>
          <p className="text-white/50 text-sm mt-1">PINs para que tu equipo canjee premios</p>
        </div>
        <button onClick={() => setShowForm(p => !p)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          + Nuevo PIN
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <p className="text-white font-medium">Crear nuevo Staff PIN</p>
          <div>
            <label className="text-white/60 text-sm block mb-1">Nombre del empleado</label>
            <input required value={staffName} onChange={e => setStaffName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500"
              placeholder="Ej: María García"/>
          </div>
          <div>
            <label className="text-white/60 text-sm block mb-1">PIN (6 dígitos numéricos)</label>
            <input required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,"").slice(0,6))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 font-mono tracking-widest text-lg"
              placeholder="123456" maxLength={6}/>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setError(""); }}
              className="flex-1 py-3 rounded-xl text-white/60 bg-white/5 hover:bg-white/10 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || pin.length !== 6}
              className="flex-1 py-3 rounded-xl text-white font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors">
              {saving ? "Creando..." : "Crear PIN"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <p className="text-white/60 text-sm mb-1">URL de canje para staff:</p>
        <p className="text-white font-mono text-sm">{appUrl}/staff</p>
        {orgId && <p className="text-white/40 text-xs mt-2">ID de tu organización: <span className="font-mono text-violet-300">{orgId}</span></p>}
      </div>

      {loading ? (
        <p className="text-white/40 text-center py-8">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {pins.map(pin => (
            <div key={pin.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400 font-mono font-bold text-lg">{pin.pin}</div>
                <div>
                  <p className="text-white font-medium">{pin.staffName}</p>
                  <p className="text-white/40 text-xs">{pin.redeemedCount} canjes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${pin.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {pin.isActive ? "Activo" : "Inactivo"}
                </span>
                {pin.isActive && (
                  <button onClick={() => handleDeactivate(pin.id)}
                    className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
          {pins.length === 0 && (
            <div className="text-center py-12 border border-dashed border-white/20 rounded-2xl">
              <p className="text-white/40 mb-2">No hay PINs configurados</p>
              <p className="text-white/30 text-sm">Creá al menos un PIN para que tu equipo pueda canjear premios</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
