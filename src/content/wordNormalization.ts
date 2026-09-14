export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^d['’]/, '')
    .replace(/[.,!?;:'"’()]/g, '')
    .trim();
}

/**
 * Strips a leading Luxembourgish article ("de", "den", "d'", "en", "eng", "e")
 * from a vocabulary prompt like "de Papp" or "d'Mamm", so a card that
 * teaches a noun together with its article still counts as a single word
 * for glossary/item-extraction purposes and the bare noun stays matchable
 * inside sentences.
 */
export function stripLeadingArticle(text: string): string {
  return text.trim().replace(/^(d['’]|den|de|eng|en|e)\s+/i, '');
}

export function isSingleLuWord(text: string): boolean {
  return !stripLeadingArticle(text).includes(' ');
}
