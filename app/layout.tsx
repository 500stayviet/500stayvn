import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "500stay.vn - 새 매물 등록",
  description: "Vietnam Real Estate Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
