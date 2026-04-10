/**
 * Bio utilities: rilevamento link e rendering
 */

const LINK_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/i;

export function containsLink(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false;
  return LINK_REGEX.test(text.trim());
}

/** Estrae segmenti: testo e url per rendering (solo se approved) */
export function parseBioWithLinks(bio: string | null | undefined): { type: 'text' | 'url'; value: string }[] {
  if (!bio || !bio.trim()) return [];
  const segments: { type: 'text' | 'url'; value: string }[] = [];
  let remaining = bio;
  const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  let match: RegExpExecArray | null;
  let lastIndex = 0;
  while ((match = re.exec(bio)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: bio.slice(lastIndex, match.index) });
    }
    let url = match[0];
    if (/^www\./i.test(url)) url = 'https://' + url;
    segments.push({ type: 'url', value: url });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < bio.length) {
    segments.push({ type: 'text', value: bio.slice(lastIndex) });
  }
  return segments;
}
