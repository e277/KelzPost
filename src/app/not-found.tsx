import Link from "next/link";
import { getSettings } from "@/lib/site";
import { getSiteText } from "@/lib/site-text";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function NotFound() {
  const settings = await getSettings();
  const text = getSiteText(settings);

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="not-found">
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">{text.notFoundHeading}</h1>
        <p className="not-found__text">{text.notFoundText}</p>
        <Link href="/" className="btn btn--navy">
          ← {text.backToBlog}
        </Link>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
