import type { Metadata } from "next";
import "./globals.css";

import Providers from "./components/providers/Providers";

export const metadata: Metadata = {
  title: "Athlos AI",
  description: "Treinador inteligente para ciclistas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}