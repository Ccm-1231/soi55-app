import type { Metadata } from "next";
import { Caveat, Lato } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// BoonTook Mon — SIL Open Font License, https://github.com/fontuni/boontook
const boonTookMon = localFont({
  src: "./fonts/BoonTookMon-Regular.otf",
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

const lato = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const caveat = Caveat({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Soi 55 Thai Kitchen — Blackwolf Board",
  description: "Log, track, and follow up on customer complaints across every Soi 55 location.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${boonTookMon.variable} ${lato.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-cream font-body">{children}</body>
    </html>
  );
}
