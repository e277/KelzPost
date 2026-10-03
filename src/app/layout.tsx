import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { getSettings, SITE_URL } from "@/lib/site";
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: settings.blogTitle,
    description: settings.tagline,
    openGraph: {
      type: "website",
      siteName: settings.blogTitle,
      title: settings.blogTitle,
      description: settings.tagline,
      images: [`${SITE_URL}/og`],
    },
    twitter: { card: "summary_large_image" },
    alternates: {
      types: { "application/rss+xml": [{ url: `${SITE_URL}/feed.xml`, title: `${settings.blogTitle} RSS` }] },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  const themeVars = `:root{--navy:${settings.navyColor};--gold:${settings.accentColor};}`;
  // Applies the visitor's saved (or system) colour scheme before first paint. The admin stays light.
  const themeScript = `(function(){try{if(location.pathname.indexOf("/admin")===0)return;var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
