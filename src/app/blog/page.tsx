import { permanentRedirect } from "next/navigation";

type Props = { searchParams: Promise<{ category?: string | string[]; page?: string | string[] }> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The Blog page was merged into the home page; keep old /blog links (and their
// category filter and page number) working.
export default async function OldBlogPage({ searchParams }: Props) {
  const query = await searchParams;
  const params = new URLSearchParams();
  const category = first(query.category);
  const page = first(query.page);
  if (category) params.set("category", category);
  if (page) params.set("page", page);
  const search = params.toString();
  permanentRedirect(search ? `/?${search}` : "/");
}
