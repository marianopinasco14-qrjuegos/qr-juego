"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Error al cambiar la contraseña.");
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
          <h1 className="text-white text-xl font-bold">Nueva contraseña</h1>
          <p className="text-white/50 text-sm mt-1">Elegí una contraseña segura</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 8 caracteres)"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500"
            />
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar contraseña"
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
              {loading ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <p className="text-green-400 font-bold text-lg">✅ Contraseña actualizada</p>
              <p className="text-white/50 text-sm mt-2">Ya podés ingresar con tu nueva contraseña.</p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl font-bold text-white text-center bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              Ir al login →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
