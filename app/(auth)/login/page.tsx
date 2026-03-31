"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { setError("Email o contraseña incorrectos"); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><div className="text-5xl mb-3">🎰</div><h1 className="text-white text-2xl font-bold">QR Juego</h1><p className="text-white/50 text-sm mt-1">Dashboard</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500" placeholder="Email" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500" placeholder="Contraseña" />
          {error && <p className="text-red-400 text-sm bg-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50">{loading ? "Ingresando..." : "Ingresar"}</button>
        </form>
        <p className="text-white/30 text-xs text-center mt-6">Demo: admin@qrjuego.com / Admin123!</p>
      </div>
    </div>
  );
}
