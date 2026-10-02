import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Systems and Safeguards",
  description: "Insights, stories, and ideas worth reading.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const themeVars = `:root{--navy:${settings.navyColor};--gold:${settings.accentColor};}`;

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
