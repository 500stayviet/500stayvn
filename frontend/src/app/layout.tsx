import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Be_Vietnam_Pro, Noto_Sans_KR, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationProvider } from "@/contexts/TranslationProvider";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import BottomNavigation from "@/components/BottomNavigation";
import AppBox from "@/components/AppBox";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "500 STAY VN",
  description: "베트남 숙박 예약 플랫폼 - 7일 단위 숙박 예약 시스템",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    title: "500 STAY VN",
    statusBarStyle: "black-translucent",
  },
  applicationName: "500 STAY VN",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "500 STAY VN",
    title: "500 STAY VN - 베트남 숙박 예약",
    description: "베트남 숙박 예약 플랫폼 - 7일 단위 숙박 예약 시스템",
  },
  twitter: {
    card: "summary",
    title: "500 STAY VN",
    description: "베트남 숙박 예약 플랫폼 - 7일 단위 숙박 예약 시스템",
  },
};

export const viewport: Viewport = {
  themeColor: "#E63946",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${beVietnamPro.variable} ${notoSansKR.variable} ${notoSansJP.variable}`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="500 STAY VN" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="500 STAY VN" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <LanguageProvider>
            <TranslationProvider>
              <div className="min-h-screen bg-[#F3F4F6] flex justify-center">
                <AppBox className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col">
                  <main className="flex-1 pb-14">
                    {children}
                  </main>
                  <BottomNavigation />
                </AppBox>
              </div>
            </TranslationProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}