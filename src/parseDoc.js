/** @typedef {{ pinyin: string, meaning: string, type: string }} Word */

/**
 * @param {string} text
 * @returns {Word[]}
 */
export function parseFlashcardText(text) {
  const words = [];
  const lines = String(text).split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u00A0/g, " ").trim();
    if (!line) continue;

    const parts = line.split(";");
    if (parts.length !== 3) continue;

    const pinyin = parts[0].trim();
    const meaning = parts[1].trim();
    const type = parts[2].trim();
    if (!pinyin || !meaning || !type) continue;

    words.push({ pinyin, meaning, type });
  }

  return words;
}

/**
 * @param {string} title
 * @returns {string}
 */
export function slugifyDeckId(title) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "deck";
}
