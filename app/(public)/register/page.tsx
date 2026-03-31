"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PLANS = [
  { slug: "starter", name: "Starter", price: "Gratis", features: ["2 juegos QR", "500 escaneos/juego", "1.000 leads"] },
  { slug: "growth", name: "Growth", price: "$29.99/mes", features: ["5 juegos QR", "2.000 escaneos/juego", "5.000 leads", "Webhooks"] },
  { slug: "pro", name: "Pro", price: "$99.99/mes", features: ["20 juegos QR", "10.000 escaneos/juego", "Leads ilimitados", "White label", "Afiliados"] },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const couponParam = searchParams.get("coupon") ?? "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
    couponCode: couponParam,
    referralCode: refCode,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al registrarse.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
        <div className="bg-[#1a1a2e] rounded-2xl p-8 text-center max-w-md w-full border border-purple-500/30">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Cuenta creada!</h2>
          <p className="text-gray-400">Tu trial de 14 días ya está activo. Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-900/40 to-[#0f0f1a] py-12 px-4 text-center">
        <div className="text-4xl mb-3">🎰</div>
        <h1 className="text-3xl font-bold mb-2">QR Juego</h1>
        <p className="text-gray-400 text-lg">Empieza gratis — 14 días de trial sin tarjeta</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Formulario */}
        <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-bold mb-6">Crear cuenta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Tu nombre</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                placeholder="María García"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                placeholder="maria@negocio.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Contraseña (mín. 8 caracteres)</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Nombre de tu negocio</label>
              <input
                name="orgName"
                value={form.orgName}
                onChange={handleChange}
                required
                className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                placeholder="Restaurante El Buen Sabor"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Cupón de descuento (opcional)</label>
              <input
                name="couponCode"
                value={form.couponCode}
                onChange={handleChange}
                className="w-full bg-[#0f0f1a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 uppercase"
                placeholder="TRIAL30"
              />
            </div>
            {form.referralCode && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
                <span>🔗</span>
                <span>Código de referido aplicado: <strong>{form.referralCode}</strong></span>
              </div>
            )}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Creando cuenta..." : "Empezar trial gratis →"}
            </button>
            <p className="text-center text-sm text-gray-500">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-purple-400 hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>

        {/* Planes */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-2">Todos los planes incluyen 14 días gratis</h2>
          <p className="text-gray-400 text-sm mb-4">Sin tarjeta de crédito. Podés actualizar en cualquier momento.</p>
          {PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`rounded-xl p-5 border ${
                plan.slug === "growth"
                  ? "border-purple-500 bg-purple-900/20"
                  : "border-white/10 bg-[#1a1a2e]"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  {plan.slug === "growth" && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Recomendado</span>
                  )}
                </div>
                <span className="font-bold text-purple-300">{plan.price}</span>
              </div>
              <ul className="space-y-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-400 flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/10 text-sm text-gray-400">
            <p className="flex items-center gap-2">🔒 Pago seguro con Paddle / Dlocal</p>
            <p className="flex items-center gap-2 mt-1">🛡️ Podés cancelar en cualquier momento</p>
            <p className="flex items-center gap-2 mt-1">🎁 14 días gratis sin tarjeta</p>
          </div>
        </div>
      </div>
    </div>
  );
}
