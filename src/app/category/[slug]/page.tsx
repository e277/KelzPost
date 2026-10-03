import { permanentRedirect } from "next/navigation";
import { categoryHref } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

// Categories now live on the Blog page as filters; keep old links and search results working.
export default async function OldCategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const pageNumber = Array.isArray(page) ? page[0] : page;
  permanentRedirect(`${categoryHref(slug)}${pageNumber ? `&page=${encodeURIComponent(pageNumber)}` : ""}`);
}
