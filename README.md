# Mandarin Flashcards

Study site + **admin upload** for Mandarin decks. Word files (`.docx`) are uploaded on the admin page, saved to **Firebase Firestore**, and the public site is hosted on **GitHub Pages**.

| Page | URL |
|------|-----|
| Study (all decks) | `https://<username>.github.io/<repo-name>/` |
| One deck | `.../?deck=lesson-1` |
| **Admin upload** | `.../admin.html` |

---

## Quick start (full flow)

### 1. Firebase

1. [Firebase Console](https://console.firebase.google.com/) → create a project.
2. **Authentication** → **Sign-in method** → enable **Email/Password**.
3. **Authentication** → **Users** → **Add user** (your admin email + password).
4. **Firestore** → create database.
5. **Deploy Firestore rules** (choose one):
   - **CLI (recommended):** see [Deploy rules with Firebase CLI](#deploy-rules-with-firebase-cli) below.
   - **Console:** Firestore → **Rules** → paste `firestore.rules` → **Publish**.
6. **Project settings** → **Your apps** → add a **Web** app → copy config keys.

### 2. Local setup

```powershell
cd path\to\cursor_2
copy .env.example .env
```

Fill in all `VITE_FIREBASE_*` values in `.env`.

```powershell
npm install
npm run dev
```

- Study: `http://localhost:5173`
- Admin: `http://localhost:5173/admin.html` → sign in → upload `.docx`

### 3. Word document format

One card per line:

```
nǐ hǎo;hello
xiè xie;thank you
```

### 4. Deploy to GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment** → Source: **GitHub Actions**.
3. **Settings → Secrets and variables → Actions** → add secrets (same names as `.env`):

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

4. Push to `main` or `master`. The workflow deploys automatically.

Live site: `https://<username>.github.io/<repo-name>/`  
Admin: `https://<username>.github.io/<repo-name>/admin.html`

---

## Deploy rules with Firebase CLI

From the project folder:

```powershell
cd path\to\cursor_2
npm install
```

1. **Log in** (once per machine):

   ```powershell
   npx firebase login
   ```

2. **Link your Firebase project** (once per machine):

   ```powershell
   copy .firebaserc.example .firebaserc
   ```

   Edit `.firebaserc` and replace `your-firebase-project-id` with your real project ID (same as `VITE_FIREBASE_PROJECT_ID` in `.env`).

   Or run:

   ```powershell
   npx firebase use --add
   ```

3. **Deploy only Firestore rules:**

   ```powershell
   npm run deploy:rules
   ```

   Same as: `firebase deploy --only firestore:rules`

4. Confirm in Firebase Console → **Firestore** → **Rules** tab.

---

## Admin workflow

1. Open **admin.html** on your deployed site (or locally).
2. Sign in with the Firebase admin user.
3. Enter **deck title** and **deck link id** (e.g. `lesson-1`).
4. Drop or select a `.docx` file.
5. Click **Upload to Firebase**.
6. Copy the share link for students — they use the main site with `?deck=lesson-1`.

Re-uploading the same deck id **updates** that deck.

---

## Manual deck (optional)

You can still add decks in the Firebase Console → collection `decks` → see `seed/sample-deck.json` for structure.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Upload permission denied | Publish `firestore.rules`; sign in on admin page |
| Sign in failed | Enable Email/Password auth; create user in Firebase |
| Site blank on GitHub | Add all six `VITE_FIREBASE_*` secrets; enable GitHub Pages Actions |
| Admin link 404 | Deploy from `main`; open `.../admin.html` not `/admin` |
