import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Nav from '@/components/Nav'

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://recettes-thermomix.vercel.app'),
  title: {
    default: "Thermomix With Love, Hasna — Conseillère Thermomix",
    template: "%s | Thermomix With Love, Hasna",
  },
  description: "Conseillère Thermomix : recettes testées, accompagnement personnalisé avant/après achat, ateliers et astuces pour cuisiner au Thermomix au quotidien.",
  keywords: ["Thermomix", "conseillère Thermomix", "recettes Thermomix", "TM7", "achat Thermomix", "atelier Thermomix"],
  openGraph: {
    title: "Thermomix With Love, Hasna — Conseillère Thermomix",
    description: "Recettes testées, accompagnement personnalisé et ateliers Thermomix.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFBF6] text-[#3A3532]">
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <Nav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
