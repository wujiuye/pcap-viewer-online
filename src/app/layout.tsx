import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pcapviewer.online"),
  title: "PCAP Viewer Online | View PCAP Files Free In Your Browser",
  description: "Free online PCAP viewer. Open, parse, and analyze PCAP/PCAPNG files locally in your browser. No installation needed. 100% secure with no uploads.",
  keywords: "PCAP Viewer, PCAP Viewer Online, Online PCAP analyzer, open PCAP file, local PCAP reader",
  alternates: {
    canonical: "https://pcapviewer.online",
  },
  openGraph: {
    title: "PCAP Viewer Online",
    description: "Free online PCAP viewer. Open, parse, and analyze PCAP/PCAPNG files locally in your browser. No installation needed. 100% secure with no uploads.",
    url: "https://pcapviewer.online",
    siteName: "PCAP Viewer Online",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PCAP Viewer Online",
    description: "Analyze PCAP/PCAPNG files locally in your browser without data upload.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
