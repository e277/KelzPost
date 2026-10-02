import Link from "next/link";
import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function NotFound() {
  const settings = await getSettings();

  return (
    <>
      <SiteHeader settings={settings} />
      <main className="not-found">
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__text">The page you&apos;re looking for doesn&apos;t exist or may have been moved.</p>
        <Link href="/" className="btn btn--navy">
          ← Back to Blog
        </Link>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
