/** Up to two initials from a name, e.g. "Keneil Smith" → "KS". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? "A").slice(0, 1);
  return letters.toUpperCase();
}

/** A round author photo, or their initials when they haven't added one. Decorative: the name sits next to it. */
export function AuthorAvatar({ name, src, className = "author-avatar" }: { name: string; src: string; className?: string }) {
  if (src) return <img src={src} alt="" className={className} loading="lazy" />;
  return (
    <span className={`${className} ${className}--initials`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
