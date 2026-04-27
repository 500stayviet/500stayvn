import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Be_Vietnam_Pro,
  Noto_Sans,
  Noto_Sans_KR,
  Noto_Sans_JP,
} from "next/font/google";
import "./globals.css";
import { STAYVIET_PRODUCTION_ORIGIN } from "@/constants/production-host";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationProvider } from "@/contexts/TranslationProvider";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import ConditionalRootShell from "@/components/ConditionalRootShell";
import AppUserSync from "@/components/AppUserSync";
import ApiSyncErrorBanner from "@/components/ApiSyncErrorBanner";
import AppToastBanner from "@/components/AppToastBanner";

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
  display: "swap",
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(STAYVIET_PRODUCTION_ORIGIN),
  title: "500 STAY VN",
  description: "Vietnam stays booking platform — weekly (7-night) stays.",
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
    url: STAYVIET_PRODUCTION_ORIGIN,
    siteName: "500 STAY VN",
    title: "500 STAY VN — Vietnam stays",
    description: "Vietnam stays booking platform — weekly (7-night) stays.",
  },
  twitter: {
    card: "summary",
    title: "500 STAY VN",
    description: "Vietnam stays booking platform — weekly (7-night) stays.",
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
      className={`${beVietnamPro.variable} ${notoSans.variable} ${notoSansKR.variable} ${notoSansJP.variable}`}
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* zh UI auxiliary font — loaded in root head (not via next/font) */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <LanguageProvider>
            <TranslationProvider>
              <AppUserSync />
              <ApiSyncErrorBanner />
              <AppToastBanner />
              <ConditionalRootShell>{children}</ConditionalRootShell>
            </TranslationProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}