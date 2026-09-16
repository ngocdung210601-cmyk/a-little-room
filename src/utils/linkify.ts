const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,:;!?'")\]])/gi

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_RE)
  return match ? match[0] : null
}

/** Splits text into plain-text and URL segments so links can be rendered as anchors. */
export function splitTextWithLinks(text: string): Array<{ text: string; isLink: boolean }> {
  const parts: Array<{ text: string; isLink: boolean }> = []
  let lastIndex = 0
  for (const match of text.matchAll(URL_RE)) {
    const index = match.index ?? 0
    if (index > lastIndex) parts.push({ text: text.slice(lastIndex, index), isLink: false })
    parts.push({ text: match[0], isLink: true })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isLink: false })
  return parts
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
