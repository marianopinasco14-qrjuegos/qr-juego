import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TerminosPage({ params }: { params: { slug: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { qrSlug: params.slug },
    include: { rafflePrizes: true },
  });

  if (!campaign || campaign.gameType !== "SORTEO") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white text-xl font-bold">Página no encontrada</p>
          <p className="text-white/40 text-sm mt-2">Los términos y condiciones de este sorteo no están disponibles.</p>
        </div>
      </div>
    );
  }

  const primary = campaign.primaryColor || "#7C3AED";
  const bg = campaign.backgroundColor || "#1a1a2e";

  const formatDate = (d: Date | null) => {
    if (!d) return "—";
    return d.toLocaleDateString("es-AR", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          {campaign.logoUrl ? (
            <img src={campaign.logoUrl} alt="logo" className="w-16 h-16 object-contain rounded-xl mx-auto"/>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl"
              style={{ background: `linear-gradient(135deg, ${primary}, ${primary}99)` }}>
              <span className="text-3xl">🎲</span>
            </div>
          )}
          <h1 className="text-white font-black text-2xl">{campaign.name}</h1>
          <p className="text-white/50 text-sm">Términos y condiciones del sorteo</p>
        </div>

        {/* Datos del sorteo */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className="font-bold text-lg" style={{ color: primary }}>Datos del sorteo</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-4">
              <span className="text-white/50 text-sm shrink-0">Cierre de inscripción</span>
              <span className="text-white text-sm text-right">{formatDate(campaign.endDate)}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-white/50 text-sm shrink-0">Fecha del sorteo</span>
              <span className="text-white text-sm text-right">{formatDate(campaign.raffleDrawDate)}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-white/50 text-sm shrink-0">Plazo para reclamar el premio</span>
              <span className="text-white text-sm text-right">{campaign.raffleClaimDays ?? 7} días desde la fecha del sorteo</span>
            </div>
          </div>
        </div>

        {/* Premios */}
        {campaign.rafflePrizes.length > 0 && (
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className="font-bold text-lg" style={{ color: primary }}>Premios</h2>
            <div className="space-y-3">
              {campaign.rafflePrizes.map((prize) => (
                <div key={prize.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <p className="text-white font-medium">{prize.title}</p>
                    <p className="text-white/40 text-xs ml-4 shrink-0">{prize.stock} {prize.stock === 1 ? "unidad" : "unidades"}</p>
                  </div>
                  {prize.description && <p className="text-white/50 text-sm mt-1">{prize.description}</p>}
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs">Se sortea 1 suplente por cada premio.</p>
          </div>
        )}

        {/* Bases y condiciones */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className="font-bold text-lg" style={{ color: primary }}>Bases y condiciones</h2>
          {campaign.raffleTerms ? (
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{campaign.raffleTerms}</p>
          ) : (
            <p className="text-white/40 text-sm italic">Los términos y condiciones de este sorteo aún no están disponibles.</p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs pb-4">
          Sorteo organizado mediante QR Juego — qrjuego.com
        </p>
      </div>
    </div>
  );
}
