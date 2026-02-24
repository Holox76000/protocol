import "./globals.css";
import type { Metadata } from "next";
import { Cinzel, Source_Sans_3 } from "next/font/google";

const displayFont = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display"
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Protocol | Skinny-Fat Assessment",
  description: "60-second assessment for men stuck between cutting and bulking."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="font-body text-ink bg-ash">
        {children}
      </body>
    </html>
  );
}
