"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PLANS = [
  { slug: "starter", name: "Starter", price: "Gratis", features: ["2 juegos QR", "500 escaneos/juego", "1.000 leads"] },
  { slug: "growth", name: "Growth", price: "$29.99/mes", features: ["5 juegos QR", "2.000 escaneos/juego", "5.000 leads", "Webhooks"] },
  { slug: "pro", name: "Pro", price: "$99.99/mes", features: ["20 juegos QR", "10.000 escaneos/juego", "Leads ilimitados", "White label", "Afiliados"] },
];

function RegisterPageInner() {
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
        <img src="/jugalo-logo-dark.svg" alt="jugalo" className="h-12 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">Empezá gratis — 14 días de trial sin tarjeta</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Formulario */}
        <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Crear cuenta</h2>

          {/* Google OAuth */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full py-3 rounded-lg font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.4 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.5 35.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.2 5.2C37 39 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
            </svg>
            Continuar con Google
          </a>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">o completá el formulario</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

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

export default function RegisterPage() {
  return <Suspense><RegisterPageInner /></Suspense>;
}
