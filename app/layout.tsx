import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const title = "Lantern Roasters · CPQ";
const description =
  "Configure, price and quote demo for a fictional coffee roastery.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: title,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`h-full antialiased ${ibmPlexSans.variable}`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
