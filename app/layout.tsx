import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "QR Juego", description: "Gamificacion para tu negocio" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className="bg-gray-950 text-white antialiased">{children}</body></html>;
}
