import hljs from "highlight.js/lib/common";

const CODE_BLOCK = /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi;

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * Colours code blocks that name their language (<pre><code class="language-x">)
 * on the server, so readers get highlighted code without any extra script.
 */
export function highlightCodeBlocks(html: string): string {
  if (!html.includes("<pre")) return html;
  return html.replace(CODE_BLOCK, (match, preAttrs: string, codeAttrs: string, inner: string) => {
    const language = /\blanguage-([\w+#-]+)/i.exec(codeAttrs)?.[1]?.toLowerCase();
    // Leave blocks without a known language, or that already contain markup, as they are.
    if (!language || !hljs.getLanguage(language) || /<[a-z/]/i.test(inner)) return match;
    const highlighted = hljs.highlight(decodeEntities(inner), { language, ignoreIllegals: true }).value;
    return `<pre${preAttrs}><code class="hljs language-${language}">${highlighted}</code></pre>`;
  });
}
