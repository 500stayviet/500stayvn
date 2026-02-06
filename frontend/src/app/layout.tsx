import type { Metadata } from "next";
import { Geist, Geist_Mono, Be_Vietnam_Pro, Noto_Sans_KR, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationProvider } from "@/contexts/TranslationProvider";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import BottomNavigation from "@/components/BottomNavigation";

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
  title: "500stayviet",
  description: "Vietnam Real Estate Platform",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <LanguageProvider>
            <TranslationProvider>
              <div className="min-h-screen bg-gray-100 flex justify-center">
                <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col overflow-y-auto">
                  <main className="flex-1 pb-14">
                    {children}
                  </main>
                  <BottomNavigation />
                </div>
              </div>
            </TranslationProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
