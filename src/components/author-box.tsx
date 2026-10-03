import Link from "next/link";
import type { AuthorProfile } from "@/lib/posts";

/** "About the author" card shown at the end of a post. */
export function AuthorBox({ author }: { author: AuthorProfile }) {
  const firstName = author.name.split(" ")[0];
  return (
    <aside className="author-box" aria-label="About the author">
      {author.avatar ? (
        <img src={author.avatar} alt="" className="author-box__avatar" />
      ) : (
        <div className="author-box__avatar author-box__avatar--placeholder" aria-hidden="true">
          {(author.name || "A")[0]?.toUpperCase()}
        </div>
      )}
      <div>
        <p className="author-box__label">Written by</p>
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
