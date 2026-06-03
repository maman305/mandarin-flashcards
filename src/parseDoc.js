/** @typedef {{ pinyin: string, meaning: string }} Word */

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

    const sep = line.search(/[;\t；]/);
    if (sep === -1) continue;

    const pinyin = line.slice(0, sep).trim();
    const meaning = line.slice(sep + 1).trim();
    if (!pinyin || !meaning) continue;

    words.push({ pinyin, meaning });
  }

  return words;
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Word[]>}
 */
export async function parseDocxBuffer(buffer) {
  const mammothModule = await import("mammoth");
  const mammoth = mammothModule.default ?? mammothModule;
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return parseFlashcardText(result.value);
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
