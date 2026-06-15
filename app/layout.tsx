import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruum Ruum Conductor | By MoviliaX",
  description: "Panel móvil para conductores de Ruum Ruum"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
