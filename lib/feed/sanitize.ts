const DANGEROUS_ELEMENTS = "script,style,noscript,template,iframe,object,embed,svg,math,form,input,button,textarea,select,option,link,meta,base";

function decodeBasicEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, name: string) => {
    if (name.startsWith("#x") || name.startsWith("#X")) {
      const code = Number.parseInt(name.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(Math.min(code, 0x10ffff)) : match;
    }
    if (name.startsWith("#")) {
      const code = Number.parseInt(name.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(Math.min(code, 0x10ffff)) : match;
    }
    return entities[name.toLowerCase()] ?? match;
  });
}

/**
 * Imported feed markup is rendered as text, never injected as HTML. This removes every tag,
 * dangerous element, and attribute while preserving readable text and line breaks.
 */
export function sanitizeFeedText(input: string | undefined): string {
  if (!input) return "";
  if (typeof DOMParser !== "undefined") {
    const document = new DOMParser().parseFromString(`<body>${input}</body>`, "text/html");
    document.querySelectorAll(DANGEROUS_ELEMENTS).forEach((element) => element.remove());
    document.querySelectorAll("br").forEach((element) => element.replaceWith("\n"));
    document.querySelectorAll("p,li,blockquote,pre,div,section,article,h1,h2,h3,h4,h5,h6").forEach((element) => element.append("\n"));
    return (document.body.textContent ?? "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  // Deterministic test/SSR fallback. Output is still rendered as text, so tag removal is conservative on purpose.
  return decodeBasicEntities(
    input
      .replace(/<(script|style|noscript|template|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|blockquote|pre|div|section|article|h[1-6])>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeFeedTitle(input: string | undefined): string {
  return sanitizeFeedText(input).replace(/\s+/g, " ").slice(0, 300);
}
