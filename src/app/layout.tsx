import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSettings, SITE_URL } from "@/lib/site";
import "./globals.css";

// Inter and Playfair Display (Latin, variable weight) are kept in ./fonts rather
// than fetched from Google Fonts while building, so a build never fails because
// that download did. Both are under the SIL Open Font License (see ./fonts).
const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const playfair = localFont({
  src: "./fonts/playfair-display-latin-variable.woff2",
  variable: "--font-playfair",
  weight: "400 900",
  display: "swap",
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
