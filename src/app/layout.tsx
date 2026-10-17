import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://oxylon.vercel.app"),
  title: "OXYLOAN – Invest with USDT on BNB Smart Chain",
  description: "Invest USDT (BEP-20), receive OXYLOAN through PancakeSwap, and earn referral rewards.",
  icons: { icon: "/logo.png" },
  openGraph: { title: "OXYLOAN", description: "Invest with USDT on BNB Smart Chain", images: ["/logo.png"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#060505" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
