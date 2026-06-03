import { isFirebaseConfigured } from "./firebase.js";
import { fetchAllDecks, fetchDeck } from "./decks.js";

/** @typedef {{ pinyin: string, meaning: string }} Card */
/** @typedef {{ id: string, title: string, words: Card[] }} Deck */

const loadingSection = document.getElementById("loading-section");
const homeSection = document.getElementById("home-section");
const studySection = document.getElementById("study-section");
const homeStatus = document.getElementById("home-status");
const deckListEl = document.getElementById("deck-list");
const deckTitleEl = document.getElementById("deck-title");
const copyLinkBtn = document.getElementById("copy-link-btn");
const flipBtn = document.getElementById("flip-btn");
const frontText = document.getElementById("front-text");
const backText = document.getElementById("back-text");
const frontLabel = document.getElementById("front-label");
const backLabel = document.getElementById("back-label");
const cardCounter = document.getElementById("card-counter");
const deckSizeEl = document.getElementById("deck-size");
const frontMode = document.getElementById("front-mode");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const reshuffleBtn = document.getElementById("reshuffle-btn");
const homeBtn = document.getElementById("home-btn");
const wordListEl = document.getElementById("word-list");
const wordListPanel = document.getElementById("word-list-panel");
const toggleWordListBtn = document.getElementById("toggle-word-list-btn");

/** @type {Deck | null} */
let activeDeck = null;
/** @type {Card[]} */
let deck = [];
/** @type {Card[]} */
let allCards = [];
let index = 0;
let flipped = false;

function getDeckIdFromUrl() {
  return new URLSearchParams(window.location.search).get("deck");
}

function deckUrl(deckId) {
  const url = new URL(window.location.href);
  url.searchParams.set("deck", deckId);
  return url.toString();
}

function goHome() {
  const url = new URL(window.location.href);
  url.searchParams.delete("deck");
  window.history.pushState({}, "", url);
  showHome();
}

function goToDeck(deckId) {
  const url = new URL(window.location.href);
  url.searchParams.set("deck", deckId);
  window.history.pushState({}, "", url);
  loadDeck(deckId);
}

function showSection(section) {
  loadingSection.classList.add("hidden");
  homeSection.classList.add("hidden");
  studySection.classList.add("hidden");
  section.classList.remove("hidden");
}

function showLoading() {
  showSection(loadingSection);
}

function setHomeStatus(message, type = "") {
  homeStatus.textContent = message;
  homeStatus.className = `status${type ? ` ${type}` : ""}`;
}

function updateWordListToggle() {
  const visible = !wordListPanel.classList.contains("hidden");
  toggleWordListBtn.textContent = visible ? "Hide word list" : "Show word list";
  toggleWordListBtn.setAttribute("aria-expanded", String(visible));
}

/** @param {Card[]} cards */
function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** @param {string} str */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {string} str */
function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

/** @param {Card[]} cards */
function renderWordList(cards) {
  wordListEl.innerHTML = cards
    .map(
      (card) =>
        `<li class="word-list-item" data-pinyin="${escapeAttr(card.pinyin)}" data-meaning="${escapeAttr(card.meaning)}">
          <span class="word-pinyin">${escapeHtml(card.pinyin)}</span>
          <span class="word-sep" aria-hidden="true">·</span>
          <span class="word-meaning">${escapeHtml(card.meaning)}</span>
        </li>`
    )
    .join("");
}

function highlightCurrentInList() {
  const card = currentCard();
  if (!card) return;

  for (const item of wordListEl.querySelectorAll(".word-list-item")) {
    const match =
      item.dataset.pinyin === card.pinyin && item.dataset.meaning === card.meaning;
    item.classList.toggle("current", match);
    if (match) {
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
}

function setFlipped(value) {
  flipped = value;
  flipBtn.classList.toggle("flipped", flipped);
  flipBtn.setAttribute("aria-pressed", String(flipped));
}

function currentCard() {
  return deck[index];
}

function renderCard() {
  const card = currentCard();
  if (!card) return;

  const showPinyinFront = frontMode.value === "pinyin";
  const front = showPinyinFront ? card.pinyin : card.meaning;
  const back = showPinyinFront ? card.meaning : card.pinyin;

  frontText.textContent = front;
  backText.textContent = back;
  frontLabel.textContent = showPinyinFront ? "Pinyin" : "Meaning";
  backLabel.textContent = showPinyinFront ? "Meaning" : "Pinyin";

  cardCounter.textContent = `${index + 1} / ${deck.length}`;
  deckSizeEl.textContent = `${deck.length} card${deck.length === 1 ? "" : "s"}`;

  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === deck.length - 1;

  setFlipped(false);
  highlightCurrentInList();
}

/** @param {Deck} deckData */
function startStudy(deckData) {
  activeDeck = deckData;
  deckTitleEl.textContent = deckData.title;
  allCards = deckData.words;
  renderWordList(allCards);
  deck = shuffle(allCards);
  index = 0;
  wordListPanel.classList.add("hidden");
  updateWordListToggle();
  showSection(studySection);
  renderCard();
}

async function showHome() {
  activeDeck = null;
  showSection(homeSection);
  deckListEl.innerHTML = "";

  if (!isFirebaseConfigured) {
    setHomeStatus(
      "Firebase is not set up. Copy .env.example to .env, add your Firebase web app keys, then restart the dev server.",
      "error"
    );
    return;
  }

  setHomeStatus("Loading decks…");
  try {
    const decks = await fetchAllDecks();
    if (decks.length === 0) {
      setHomeStatus(
        "No decks in the database yet. Add one in Firebase Console (see README).",
        "error"
      );
      return;
    }

    setHomeStatus("");
    deckListEl.innerHTML = decks
      .map(
        (d) => `
        <li class="deck-list-item">
          <a class="deck-link" href="${escapeAttr(deckUrl(d.id))}" data-deck-id="${escapeAttr(d.id)}">
            <span class="deck-link-title">${escapeHtml(d.title)}</span>
            <span class="deck-link-meta">${d.words.length} words</span>
          </a>
          <button type="button" class="btn btn-ghost btn-sm copy-deck-link" data-deck-id="${escapeAttr(d.id)}">Copy link</button>
        </li>`
      )
      .join("");

    deckListEl.querySelectorAll(".deck-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const id = /** @type {HTMLAnchorElement} */ (link).dataset.deckId;
        if (id) goToDeck(id);
      });
    });

    deckListEl.querySelectorAll(".copy-deck-link").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = /** @type {HTMLButtonElement} */ (btn).dataset.deckId;
        if (!id) return;
        await copyText(deckUrl(id));
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy link";
        }, 2000);
      });
    });
  } catch (err) {
    console.error(err);
    setHomeStatus(
      err instanceof Error ? err.message : "Could not load decks from Firebase.",
      "error"
    );
  }
}

/** @param {string} deckId */
async function loadDeck(deckId) {
  showLoading();

  if (!isFirebaseConfigured) {
    showHome();
    return;
  }

  try {
    const deckData = await fetchDeck(deckId);
    if (!deckData) {
      setHomeStatus(`Deck "${deckId}" was not found.`, "error");
      await showHome();
      return;
    }
    startStudy(deckData);
  } catch (err) {
    console.error(err);
    setHomeStatus(
      err instanceof Error ? err.message : "Could not load this deck.",
      "error"
    );
    await showHome();
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }
}

async function init() {
  const deckId = getDeckIdFromUrl();
  if (deckId) {
    await loadDeck(deckId);
  } else {
    await showHome();
  }
}

flipBtn.addEventListener("click", () => setFlipped(!flipped));

prevBtn.addEventListener("click", () => {
  if (index > 0) {
    index--;
    renderCard();
  }
});

nextBtn.addEventListener("click", () => {
  if (index < deck.length - 1) {
    index++;
    renderCard();
  }
});

frontMode.addEventListener("change", renderCard);

reshuffleBtn.addEventListener("click", () => {
  deck = shuffle(deck);
  index = 0;
  renderCard();
});

homeBtn.addEventListener("click", goHome);

copyLinkBtn.addEventListener("click", async () => {
  if (!activeDeck) return;
  await copyText(deckUrl(activeDeck.id));
  copyLinkBtn.textContent = "Link copied!";
  setTimeout(() => {
    copyLinkBtn.textContent = "Copy share link";
  }, 2000);
});

toggleWordListBtn.addEventListener("click", () => {
  wordListPanel.classList.toggle("hidden");
  updateWordListToggle();
  if (!wordListPanel.classList.contains("hidden")) {
    highlightCurrentInList();
  }
});

document.addEventListener("keydown", (e) => {
  if (studySection.classList.contains("hidden")) return;

  if (e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
    setFlipped(!flipped);
  } else if (e.key === "ArrowLeft" && index > 0) {
    index--;
    renderCard();
  } else if (e.key === "ArrowRight" && index < deck.length - 1) {
    index++;
    renderCard();
  }
});

window.addEventListener("popstate", () => {
  const deckId = getDeckIdFromUrl();
  if (deckId) {
    loadDeck(deckId);
  } else {
    showHome();
  }
});

init();
