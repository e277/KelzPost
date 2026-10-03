import sanitizeHtml from "sanitize-html";

const px = [/^\d+(\.\d+)?px$/];

// Everything the post editor can produce, and nothing that can run script.
const POST_HTML: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "strike", "del", "ins",
    "mark", "sub", "sup", "code", "pre", "blockquote", "ul", "ol", "li", "a", "img", "hr", "figure", "figcaption",
    "table", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td", "div", "span", "iframe",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["class"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    ol: ["start", "type"],
    table: ["style"],
    col: ["style", "span"],
    th: ["colspan", "rowspan", "colwidth"],
    td: ["colspan", "rowspan", "colwidth"],
    div: ["data-youtube-video"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
  },
  allowedClasses: { code: ["language-*"] },
  allowedStyles: { table: { width: px, "min-width": px }, col: { width: px, "min-width": px } },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Images may still be stored inline while no Blob store is connected.
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: false,
  allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com", "youtube.com", "player.vimeo.com"],
  // An embed from a site that isn't allowed loses its src; drop it entirely.
  exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
  transformTags: {
    // Links that open a new tab can't reach back into this page.
    a: (tagName, attribs) =>
      attribs.target === "_blank" ? { tagName, attribs: { ...attribs, rel: "noopener noreferrer" } } : { tagName, attribs },
  },
};

/** Cleans post HTML from the editor before it's stored, so no one can save script into a post. */
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, POST_HTML);
}
