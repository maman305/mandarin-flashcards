import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase.js";

/** @typedef {{ pinyin: string, meaning: string }} Word */
/** @typedef {{ id: string, title: string, words: Word[] }} Deck */

/**
 * @param {unknown} raw
 * @returns {Word[]}
 */
function normalizeWords(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const pinyin = String(/** @type {{ pinyin?: string }} */ (item).pinyin ?? "").trim();
      const meaning = String(/** @type {{ meaning?: string }} */ (item).meaning ?? "").trim();
      if (!pinyin || !meaning) return null;
      return { pinyin, meaning };
    })
    .filter(Boolean);
}

/**
 * @param {string} id
 * @param {import("firebase/firestore").DocumentData} data
 * @returns {Deck | null}
 */
function toDeck(id, data) {
  const words = normalizeWords(data.words);
  if (words.length === 0) return null;
  return {
    id,
    title: String(data.title ?? id).trim() || id,
    words,
  };
}

export function assertFirebaseReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      "Firebase is not configured. Add your web app keys to a .env file (see .env.example)."
    );
  }
}

/** @returns {Promise<Deck[]>} */
export async function fetchAllDecks() {
  assertFirebaseReady();
  const snap = await getDocs(collection(db, "decks"));
  /** @type {Deck[]} */
  const decks = [];
  for (const docSnap of snap.docs) {
    const deck = toDeck(docSnap.id, docSnap.data());
    if (deck) decks.push(deck);
  }
  decks.sort((a, b) => a.title.localeCompare(b.title));
  return decks;
}

/** @param {string} deckId */
export async function fetchDeck(deckId) {
  assertFirebaseReady();
  const docSnap = await getDoc(doc(db, "decks", deckId));
  if (!docSnap.exists()) return null;
  return toDeck(docSnap.id, docSnap.data());
}

/**
 * @param {string} deckId
 * @param {string} title
 * @param {Word[]} words
 */
export async function saveDeck(deckId, title, words) {
  assertFirebaseReady();
  const normalized = normalizeWords(words);
  if (normalized.length === 0) {
    throw new Error("No valid words. Each line must be: pinyin;meaning");
  }
  await setDoc(
    doc(db, "decks", deckId),
    {
      title: title.trim() || deckId,
      words: normalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return normalized.length;
}
