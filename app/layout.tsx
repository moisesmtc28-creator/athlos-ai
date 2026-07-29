import type { Metadata } from "next";
import "./globals.css";

import Providers from "./components/providers/Providers";
import MobileNavigation from "./components/layout/MobileNavigation";

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
        <Providers>
          {children}
          <MobileNavigation />
        </Providers>
      </body>
    </html>
  );
}