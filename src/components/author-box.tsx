import Link from "next/link";
import type { Settings } from "@/db/schema";

/** "About the author" card shown at the end of a post. */
export function AuthorBox({ settings, name }: { settings: Settings; name: string }) {
  // The avatar and bio in Settings belong to the blog's main author.
  const isMainAuthor = !name || name === settings.authorName;
  const bio = isMainAuthor ? settings.authorBio : "";

  return (
    <aside className="author-box" aria-label="About the author">
      {isMainAuthor && settings.authorAvatar ? (
        <img src={settings.authorAvatar} alt="" className="author-box__avatar" />
      ) : (
        <div className="author-box__avatar author-box__avatar--placeholder" aria-hidden="true">
          {(name || "A")[0]?.toUpperCase()}
        </div>
      )}
      <div>
        <p className="author-box__label">Written by</p>
        <p className="author-box__name">{name}</p>
        {bio && <p className="author-box__bio">{bio}</p>}
        {isMainAuthor && (
          <Link href="/about" className="author-box__link">
            More about {name.split(" ")[0]} →
          </Link>
        )}
      </div>
    </aside>
  );
}
