import type { Metadata } from "next";
import { Amiri_Quran, Lato } from "next/font/google";
import { ToastProvider } from "@/components/UI/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import Footer from "@/components/Layout/Footer";
import EmailCaptureModal from "@/components/UI/EmailCaptureModal";
import { GA_ID } from "@/lib/analytics/ga";
import "./globals.css";

const amiriQuran = Amiri_Quran({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-amiri-quran",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tilawah - Free Quran Recitation Checker & Tajweed Teacher",
  description: "Learn to recite the Quran correctly with real-time Tajweed correction. Listen to verified Qari pronunciation, fix mistakes instantly, and learn from absolute basics - completely free.",
  keywords: [
    "quran recitation checker", "tajweed learning app", "learn quran online free",
    "quran pronunciation corrector", "tajweed rules for beginners", "quran recitation practice",
    "learn arabic quran", "quran for beginners", "islamic learning app", "quran memorization help",
    "online quran teacher", "free quran app", "quran recitation with tajweed",
    "learn surah al fatiha", "quran learning website"
  ],
  authors: [{ name: "Tilawah" }],
  robots: "index, follow",
  alternates: {
    canonical: "https://tilawah.vercel.app",
  },
  openGraph: {
    title: "Tilawah - Real-Time Quran Recitation Checker",
    description: "Recite the Quran. Get corrected instantly. Learn Tajweed from scratch. Free forever.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tilawah - Free Quran Recitation Checker",
    description: "Real-time Tajweed correction. Verified Qari audio. Learn from basics. Free.",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  verification: {
    google: "nE31zfopQ4RKaFt2p-kyhvABVCOhPz25aJ_3GwwS0hM",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* Google Analytics Tag */}
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Tilawah",
              "url": "https://tilawah.vercel.app",
              "description": "Free Quran recitation checker with real-time Tajweed correction",
              "applicationCategory": "EducationApplication",
              "operatingSystem": "Web Browser",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
              "audience": { "@type": "Audience", "audienceType": "Muslims learning Quran recitation" }
            }),
          }}
        />
      </head>
      <body className={`${amiriQuran.variable} ${lato.variable} font-lato antialiased text-ink bg-parchment transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ToastProvider>
            <div className="flex flex-col min-h-screen w-full">
              <div className="flex-grow w-full">{children}</div>
              <Footer />
            </div>
            <EmailCaptureModal />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
