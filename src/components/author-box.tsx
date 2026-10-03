import Link from "next/link";
import { AuthorAvatar } from "@/components/author-avatar";
import type { AuthorProfile } from "@/lib/posts";

/** "About the author" card shown at the end of a post. */
export function AuthorBox({ author, label = "Written by" }: { author: AuthorProfile; label?: string }) {
  const firstName = author.name.split(" ")[0];
  return (
    <aside className="author-box" aria-label="About the author">
      <AuthorAvatar name={author.name} src={author.avatar} className="author-box__avatar" />
      <div>
        <p className="author-box__label">{label}</p>
        <p className="author-box__name">{author.name}</p>
        {author.bio && <p className="author-box__bio">{author.bio}</p>}
        {author.href && (
          <Link href={author.href} className="author-box__link">
            {author.href.startsWith("/author/") ? `All posts by ${firstName} →` : `More about ${firstName} →`}
          </Link>
        )}
      </div>
    </aside>
  );
}
