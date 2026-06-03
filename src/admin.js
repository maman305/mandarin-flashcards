import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { saveDeck } from "./decks.js";
import { auth, isFirebaseConfigured } from "./firebase.js";
import { parseFlashcardText, slugifyDeckId } from "./parseDoc.js";

const loginSection = document.getElementById("login-section");
const uploadSection = document.getElementById("upload-section");
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginStatus = document.getElementById("login-status");
const adminUserEl = document.getElementById("admin-user");
const signOutBtn = document.getElementById("sign-out-btn");
const uploadForm = document.getElementById("upload-form");
const deckTitleInput = document.getElementById("deck-title");
const deckIdInput = document.getElementById("deck-id");
const deckIdPreview = document.getElementById("deck-id-preview");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileNameEl = document.getElementById("file-name");
const parsePreview = document.getElementById("parse-preview");
const uploadBtn = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");
const uploadSuccess = document.getElementById("upload-success");
const deckLinkEl = document.getElementById("deck-link");
const copyDeckLinkBtn = document.getElementById("copy-deck-link-btn");
const openDeckLink = document.getElementById("open-deck-link");
const uploadLoader = document.getElementById("upload-loader");

/** @type {import("./parseDoc.js").Word[]} */
let parsedWords = [];
/** @type {File | null} */
let selectedFile = null;
let deckIdTouched = false;

function studyDeckUrl(deckId) {
  const url = new URL("index.html", window.location.href);
  url.searchParams.set("deck", deckId);
  return url.toString();
}

function setLoginStatus(message, type = "") {
  loginStatus.textContent = message;
  loginStatus.className = `status${type ? ` ${type}` : ""}`;
}

function setUploadStatus(message, type = "") {
  uploadStatus.textContent = message;
  uploadStatus.className = `status${type ? ` ${type}` : ""}`;
}

function showLogin() {
  loginSection.classList.remove("hidden");
  uploadSection.classList.add("hidden");
}

function showUpload(user) {
  loginSection.classList.add("hidden");
  uploadSection.classList.remove("hidden");
  adminUserEl.textContent = user?.email ? `Signed in as ${user.email}` : "";
}

function updateDeckIdPreview() {
  const id = deckIdInput.value.trim() || "lesson-1";
  deckIdPreview.textContent = id;
}

function showUploadLoader(message) {
  uploadLoader.querySelector(".upload-loader-text").textContent = message;
  uploadLoader.classList.remove("hidden");
}

function hideUploadLoader() {
  uploadLoader.classList.add("hidden");
}

function updateUploadButton() {
  uploadBtn.disabled = !(
    selectedFile &&
    parsedWords.length > 0 &&
    deckTitleInput.value.trim() &&
    deckIdInput.value.trim()
  );
}

deckTitleInput.addEventListener("input", () => {
  if (!deckIdTouched) {
    deckIdInput.value = slugifyDeckId(deckTitleInput.value);
    updateDeckIdPreview();
  }
  updateUploadButton();
});

deckIdInput.addEventListener("input", () => {
  deckIdTouched = true;
  deckIdInput.value = deckIdInput.value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  updateDeckIdPreview();
  updateUploadButton();
});

async function handleFile(file) {
  if (!file.name.toLowerCase().endsWith(".txt")) {
    setUploadStatus("Please choose a .txt file.", "error");
    return;
  }

  selectedFile = file;
  fileNameEl.textContent = file.name;
  parsePreview.textContent = "Reading document…";
  setUploadStatus("");

  try {
    const text = await file.text();
    parsedWords = parseFlashcardText(text);
    if (parsedWords.length === 0) {
      parsePreview.textContent = "Document read, but no cards were found. Use pinyin;meaning on each line or pinyin<TAB>meaning.";
      setUploadStatus("Fix the document and try again.", "error");
    } else {
      parsePreview.textContent = `Found ${parsedWords.length} word${parsedWords.length === 1 ? "" : "s"} ready to upload.`;
    }
  } catch (err) {
    console.error(err);
    parsedWords = [];
    parsePreview.textContent = "";
    setUploadStatus("Could not read the text file. Make sure the file is a valid .txt document.", "error");
  }

  updateUploadButton();
}

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth) return;

  setLoginStatus("Signing in…");
  try {
    await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value
    );
    setLoginStatus("");
  } catch (err) {
    console.error(err);
    setLoginStatus("Sign in failed. Check email and password.", "error");
  }
});

signOutBtn.addEventListener("click", async () => {
  if (auth) await signOut(auth);
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!parsedWords.length) return;

  const deckId = deckIdInput.value.trim();
  const title = deckTitleInput.value.trim();

  uploadBtn.disabled = true;
  setUploadStatus("Uploading to Firebase…");
  showUploadLoader("Uploading to Firebase…");
  uploadSuccess.classList.add("hidden");

  try {
    const count = await saveDeck(deckId, title, parsedWords);
    const link = studyDeckUrl(deckId);
    deckLinkEl.href = link;
    deckLinkEl.textContent = link;
    openDeckLink.href = link;
    uploadSuccess.classList.remove("hidden");
    setUploadStatus(`Saved ${count} words to deck "${title}".`, "success");
    alert(`Success! ${count} words were added to Firebase for deck: ${title}`);

    selectedFile = null;
    parsedWords = [];
    fileInput.value = "";
    fileNameEl.textContent = "No file selected";
    parsePreview.textContent = "";
    deckIdTouched = false;
    hideUploadLoader();
  } catch (err) {
    console.error(err);
    setUploadStatus(
      err instanceof Error ? err.message : "Upload failed. Check Firestore rules and sign-in.",
      "error"
    );
    hideUploadLoader();
  }

  updateUploadButton();
});

copyDeckLinkBtn.addEventListener("click", async () => {
  const text = deckLinkEl.href;
  try {
    await navigator.clipboard.writeText(text);
    copyDeckLinkBtn.textContent = "Copied!";
    setTimeout(() => {
      copyDeckLinkBtn.textContent = "Copy link";
    }, 2000);
  } catch {
    setUploadStatus("Could not copy link.", "error");
  }
});

if (!isFirebaseConfigured) {
  setLoginStatus(
    "Firebase is not configured. Add keys to .env (see .env.example) and restart.",
    "error"
  );
  loginForm.querySelector("button")?.setAttribute("disabled", "true");
} else if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showUpload(user);
    } else {
      showLogin();
    }
  });
}

updateDeckIdPreview();
