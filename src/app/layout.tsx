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
  description: "Open and analyze PCAP/PCAPNG files directly in your browser. A free online PCAP viewer without installing Wireshark. Your files are processed entirely in-browser and never uploaded to a server.",
  keywords: "PCAP Viewer, PCAP Viewer Online, Online PCAP analyzer, Wireshark alternative online, open PCAP file",
  openGraph: {
    title: "PCAP Viewer Online",
    description: "Free online PCAP viewer. Analyze PCAP/PCAPNG files securely inside your browser without data upload.",
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
