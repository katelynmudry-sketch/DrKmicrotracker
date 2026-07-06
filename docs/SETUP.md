# Setup — Firebase, Anthropic, and environment variables

One-time setup for a new environment (local dev or a fresh deploy). Budget about
45 minutes. You'll create a Firebase project and an Anthropic API key, then copy
10 values into a `.env` file.

## 1. Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) →
   **Add project**. Any name (e.g. "dr-ks-kitchen").
2. **Authentication** → Get started → enable two sign-in providers:
   - **Email/Password**
   - **Google**
3. **Firestore Database** → Create database → **production mode** (not test
   mode — this repo's `firestore.rules` provide the real access control).
   Pick a region close to your users.
4. **Storage** → Get started → production mode, same region.

## 2. Web app config (client-side — safe to expose)

Project settings (gear icon) → **Your apps** → Add app → Web (`</>`). Register
an app (no Firebase Hosting needed). Copy the 6 values from the `firebaseConfig`
object shown into your `.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 3. Service account (server-side — secret, never expose)

Project settings → **Service accounts** → **Generate new private key**. This
downloads a JSON file with `project_id`, `client_email`, and `private_key`.
Copy those into your `.env`:

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

The private key is multi-line PEM (`-----BEGIN PRIVATE KEY-----\n...\n-----END
PRIVATE KEY-----\n`). Paste it as a single line with literal `\n` sequences —
most `.env` tooling and Vercel's env var UI handle this correctly if you paste
the whole value, newlines and all, into one field; the app un-escapes `\n` at
runtime (see `src/integrations/firebase/admin.server.ts`).

```
FIREBASE_STORAGE_BUCKET=
```

This is the same bucket as `VITE_FIREBASE_STORAGE_BUCKET` above — set both.

## 4. Anthropic API key

[console.anthropic.com](https://console.anthropic.com) → **API keys** → Create
key. Set a spend cap (Settings → Limits) — start around **$20/month**, enough
for demo-scale usage; raise it once real patient volume is flowing.

```
ANTHROPIC_API_KEY=
```

## 5. Doctor allowlist

Comma-separated list of email addresses that should automatically get the
`doctor` role on first sign-in (see `src/lib/rubrics.functions.ts`'s
`ensureRole`). Additional doctors can also be added later from inside the app
by an existing doctor (the "add a doctor" card on the Patients page).

```
DOCTOR_EMAILS=katelyn@example.com
```

## 6. Publish the security rules

The repo's `firestore.rules`, `firestore.indexes.json`, and `storage.rules` are
the source of truth for access control — Firestore/Storage deny everything by
default until these are published. Two ways to publish:

**Console (no CLI install needed):**
- Firestore → Rules tab → paste the contents of `firestore.rules` → Publish.
- Firestore → Indexes tab → add the composite index described in
  `firestore.indexes.json` (patientId ascending, eatenAt descending, on the
  `meals` collection) if Firestore doesn't prompt you for it automatically the
  first time the app runs a filtered+sorted query.
- Storage → Rules tab → paste the contents of `storage.rules` → Publish.

**Firebase CLI:**
```
npm install -g firebase-tools
firebase login
firebase use --add            # pick the project you just created
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 7. Verify

With `.env` filled in, `npm run dev` should show the real sign-in page (not
"Preview mode" — that only appears when `VITE_FIREBASE_API_KEY` is unset).
Sign up, and your account should land as a patient; an allowlisted email should
land as a doctor.
