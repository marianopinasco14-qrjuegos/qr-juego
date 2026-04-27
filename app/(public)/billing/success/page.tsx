import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e] border border-green-500/30 rounded-2xl p-10 text-center max-w-md w-full text-white">
        <img src="/jugalo-logo-dark.svg" alt="jugalo" className="h-8 mx-auto mb-6 opacity-70" />
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">¡Pago exitoso!</h1>
        <p className="text-gray-400 mb-6">
          Tu suscripción fue activada. Ya podés disfrutar de todas las funciones de tu plan.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Ir al Dashboard →
        </Link>
      </div>
    </div>
  );
}
