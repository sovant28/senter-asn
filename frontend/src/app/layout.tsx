import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://senter-asn.vercel.app"),
  title: "SENTER ASN — BKPSDM Kabupaten Tana Toraja",
  description: "Sistem Evaluasi Disiplin Kerja & Rekapitulasi Otomatis ASN BKPSDM Kabupaten Tana Toraja",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "SENTER ASN — BKPSDM Kabupaten Tana Toraja",
    description: "Sistem Evaluasi Disiplin Kerja & Rekapitulasi Otomatis ASN BKPSDM Kabupaten Tana Toraja",
    siteName: "SENTER ASN",
    images: [
      {
        url: "/logo.png",
        width: 120,
        height: 150,
        alt: "Logo Pemkab Tana Toraja",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SENTER ASN — BKPSDM Kabupaten Tana Toraja",
    description: "Sistem Evaluasi Disiplin Kerja & Rekapitulasi Otomatis ASN BKPSDM Kabupaten Tana Toraja",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans bg-gray-50 min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
