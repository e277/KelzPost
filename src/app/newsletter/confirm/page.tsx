import Link from "next/link";
import type { Metadata } from "next";
import { confirmSubscription } from "@/lib/newsletter";
import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Confirm subscription", robots: { index: false } };

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function ConfirmSubscriptionPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const [settings, result] = await Promise.all([getSettings(), confirmSubscription(typeof token === "string" ? token : "")]);

  const copy = {
    confirmed: {
      title: "You're subscribed",
      text: `Thanks for confirming. New posts from ${settings.blogTitle} will arrive in your inbox.`,
    },
    unsubscribed: {
      title: "You're unsubscribed",
      text: "This address unsubscribed earlier. Sign up again from any post if you'd like to get emails.",
    },
    invalid: {
      title: "This link has expired",
      text: "The confirmation link isn't valid anymore. Sign up again from any post to get a fresh one.",
    },
  }[result];

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="notice-page">
        <h1 className="notice-page__title">{copy.title}</h1>
        <p className="notice-page__text">{copy.text}</p>
        <Link href="/" className="btn btn--navy">
          ← Back to Blog
        </Link>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
