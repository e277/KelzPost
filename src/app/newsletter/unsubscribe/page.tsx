import type { Metadata } from "next";
import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UnsubscribeButton } from "@/components/unsubscribe-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

type Props = { searchParams: Promise<{ token?: string | string[] }> };

// The unsubscribe happens on a button press rather than on page load, so
// mail scanners that open links can't unsubscribe readers by accident.
export default async function UnsubscribePage({ searchParams }: Props) {
  const [{ token }, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="notice-page">
        <h1 className="notice-page__title">Unsubscribe</h1>
        <p className="notice-page__text">Stop getting new posts from {settings.blogTitle} by email?</p>
        <UnsubscribeButton token={typeof token === "string" ? token : ""} />
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
