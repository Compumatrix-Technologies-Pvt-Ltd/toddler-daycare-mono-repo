import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Kindertagespflege finden | Freie Plätze in Deiner Nähe",
  description: "Finde freie Plätze für Kindertagespflege und Kitas in Deiner Nähe - einfach, schnell und verlässlich.",
};

import { LanguageProvider } from "../i18n/LanguageContext";
import { CaretakerProvider } from "../context/CaretakerContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#FAF7F2] text-[#1E1B18] antialiased selection:bg-[#A12D3A]/10 selection:text-[#A12D3A]">
        <LanguageProvider>
          <CaretakerProvider>{children}</CaretakerProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
