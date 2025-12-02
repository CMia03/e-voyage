import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cool Voyage - Agence de voyage à Madagascar",
  description: "Découvrez Madagascar avec Cool Voyage. Voyages organisés à prix abordables vers Ambila Lemaintso, Manambato, Sainte-Marie et le Grand Sud.",
  keywords: ["Madagascar", "voyage", "Cool Voyage", "Ambila Lemaintso", "Manambato", "Sainte-Marie", "Grand Sud", "agence de voyage"],
  authors: [{ name: "Cool Voyage" }],
  openGraph: {
    title: "Cool Voyage - Agence de voyage à Madagascar",
    description: "Découvrez Madagascar avec Cool Voyage. Voyages organisés à prix abordables.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
