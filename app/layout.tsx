import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "jugalo",
  description: "Gamificación para tu negocio con QR",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
