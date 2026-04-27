"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al enviar. Intentá de nuevo.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/jugalo-logo-dark.svg" alt="jugalo" className="h-10 mx-auto mb-4" />
          <h1 className="text-white text-xl font-bold">Recuperar contraseña</h1>
          <p className="text-white/50 text-sm mt-1">Te enviamos las instrucciones por email</p>
        </div>

        {!sent ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500"
              />
              {error && (
                <p className="text-red-400 text-sm bg-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </button>
            </form>
            <p className="text-center mt-4">
              <Link href="/login" className="text-violet-400 hover:underline text-sm">
                ← Volver al login
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <p className="text-green-400 font-bold text-lg">✅ Revisá tu email</p>
              <p className="text-white/50 text-sm mt-2">
                Si el email existe en nuestro sistema, recibirás las instrucciones en minutos.
              </p>
            </div>
            <Link href="/login" className="text-violet-400 hover:underline text-sm block">
              ← Volver al login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
