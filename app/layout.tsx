import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "JOYBOY TOURNAMENTS 🇨🇮 | Plateforme e-sport Ivoirienne #1",
  description:
    "JOYBOY TOURNAMENTS - La première plateforme de tournois e-sport 100% ivoirienne. Défie les meilleurs joueurs d'Abidjan, participe aux tournois, gagne tes gains via Wave. Paiement Wave: 01 51 42 99 18 | WhatsApp: 07 48 23 52 26",
  keywords: [
    "JOYBOY",
    "tournois e-sport",
    "Côte d'Ivoire",
    "Abidjan",
    "gaming CI",
    "1V1",
    "tournoi FIFA",
    "eFootball",
    "Call of Duty",
    "Wave",
  ],
  openGraph: {
    title: "JOYBOY TOURNAMENTS 🇨🇮",
    description: "La scène e-sport ivoirienne se joue ici. Tournois, 1V1, classements, gains Wave.",
    type: "website",
    locale: "fr_CI",
  },
  twitter: {
    card: "summary_large_image",
    title: "JOYBOY TOURNAMENTS 🇨🇮",
    description: "La plateforme e-sport #1 en Côte d'Ivoire",
  },
  metadataBase: new URL("https://joyboytournaments.ci"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${space.variable} min-h-screen bg-[#08080B] font-sans text-white antialiased selection:bg-[#7C3AED]/30 selection:text-white`}
      >
        <div className="relative flex min-h-screen flex-col">
          <div className="pointer-events-none fixed inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] -translate-y-1/2 rounded-full bg-[#7C3AED]/[0.08] blur-[120px]" />
            <div className="absolute top-[40%] right-0 h-[500px] w-[600px] rounded-full bg-[#06B6D4]/[0.06] blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-[400px] w-[800px] rounded-full bg-[#7C3AED]/[0.05] blur-[100px]" />
          </div>
          <PromoBanner />
          <Navbar />
          <main className="relative flex-1">{children}</main>
          <Footer />
        </div>

        <Toaster
          position="top-right"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: "#15151E",
              border: "1px solid #22222F",
              color: "white",
            },
          }}
        />
      </body>
    </html>
  );
}
