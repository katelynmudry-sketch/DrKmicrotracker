# Owner to-do — everything that needs a human with real accounts

Every phase in `docs/PLAN.md` is code-complete through Post-demo milestone #1 (the
pantry suite). What's left is entirely things I can't do without your accounts and a
real browser. This list pulls every one of those items into one place, in the order
to do them — the phase-by-phase detail and "why" for each lives in `docs/PLAN.md` and
`docs/SETUP.md` if you want it; this is just the checklist.

## 0. Just want to click through the UI? No accounts needed.

The app has a built-in **preview/mock mode** (`src/lib/mock-mode.ts`) that activates
automatically whenever Firebase isn't configured — it's not a stripped-down demo, it's
the same UI and components running on fixture data instead of a live backend.

- [ ] Import this repo into a new Vercel project.
- [ ] **Don't set any environment variables at all.**
- [ ] Deploy.
- [ ] Open the URL → click through to sign-in → instead of a real login you'll see a
  "Preview mode" picker to enter as a patient or a doctor. From there the whole app is
  clickable: meal history, a reading's full detail, the Patterns page, pantry + grocery
  list, the doctor's patient list and rubric page — all on realistic fixture data
  (`src/lib/mock-data.ts`, `src/lib/demo-data.ts`).
- [ ] Anything that would normally hit Firebase or Anthropic (uploading a photo,
  scanning a pantry photo, saving an edit) shows a "Preview mode — nothing is saved"
  toast instead of actually calling out — safe to click everything.

This is the fastest way to sanity-check that the deploy itself works and to look at
the UI/copy/design before spending any time on real accounts. It's genuinely
zero-setup: no Firebase project, no Anthropic key, no `.env` at all.

**What you can't test this way:** anything that needs a live backend — real sign-up,
a real photo actually getting read by Claude, rubric PDF extraction, pantry photo
scan/voice capture actually identifying items, data persisting across a refresh. For
that, sections 1–4 below are the real setup.

## 1. Accounts + environment (docs/SETUP.md, ~45 min)

- [ ] Create a Firebase project — Auth (email/password + Google), Firestore
  (**production mode**, not test mode), Storage. `docs/SETUP.md` §1.
- [ ] Copy the 6 web-config values into `.env` (`VITE_FIREBASE_*`). §2.
- [ ] Generate a service account key, copy the 3 admin values into `.env`
  (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). §3.
- [ ] Create an Anthropic API key at console.anthropic.com, set a spend cap (~$20/month
  to start), add it as `ANTHROPIC_API_KEY`. §4.
- [ ] Set `DOCTOR_EMAILS` to your own email (comma-separated if more than one doctor)
  so you land with doctor access on first sign-in. §5.

## 2. Publish the security rules (docs/SETUP.md §6, ~10 min)

`firestore.rules`, `firestore.indexes.json`, and `storage.rules` in this repo are the
source of truth for access control, but Firestore/Storage deny everything by default
until you publish them to your actual Firebase project — the app will look "broken"
(permission-denied errors) until this step is done, even with `.env` filled in.

- [ ] Firestore → Rules tab → paste `firestore.rules` → Publish.
- [ ] Firestore → Indexes tab → add the composite index in `firestore.indexes.json`
  (`meals`: `patientId` ascending, `eatenAt` descending) if Firestore doesn't prompt
  you for it automatically.
- [ ] Storage → Rules tab → paste `storage.rules` → Publish.

(Or the Firebase CLI equivalent — `firebase deploy --only firestore:rules,firestore:indexes,storage` — see `docs/SETUP.md` §6 for both paths.)

With `.env` filled in and rules published, `npm run dev` should show the real sign-in
page instead of "Preview mode," and signing up should land you as a doctor.

## 3. Deploy to Vercel

- [ ] Import this repo into a new Vercel project.
- [ ] Set every `.env` value as a Vercel environment variable — all of section 1 above,
  plus `DEMO_MODE=true` while you're demoing (see `docs/DEMO.md`; turn it off, or leave
  it unset, once real patients are using the app).
- [ ] Deploy.
- [ ] **Add the Vercel domain to Firebase → Authentication → Settings → Authorized
  domains.** Google sign-in silently fails on the deployed site until you do this —
  it's the single most common "it worked locally, broke in prod" gotcha here.

## 4. Verification pass on the live URL (phone + desktop)

This is the first time any of this session's work (Patterns, gap suggestions, rubric
PDF extraction, demo seed/clear, and the whole pantry suite — inventory, photo scan,
voice capture, grocery list) will be seen in a real browser. I built and verified all
of it through `typecheck`/`lint`/`build`/`ethos-lint` and logic tests against fixture
data, but this sandbox has never been able to run a dev server (no IPv6 support in the
container), so **none of it has been visually confirmed.** Walk through:

- [ ] Fresh signup → photo meal reading, end to end.
- [ ] Text-only meal logging.
- [ ] Kill the tab mid-upload → reopen → **Retry** recovers the meal.
- [ ] A deliberately bad `ANTHROPIC_API_KEY` produces a readable failure, not a silent hang.
- [ ] Inline edits to a reading persist after a refresh.
- [ ] **Nothing anywhere shows a calorie or a numeric/lettered/colour-coded score.**
- [ ] A patient account can't reach `/doctor/*`, can't see another patient's meals, and
  can't self-promote to doctor (should all be denied by the rules).
- [ ] An allowlisted email lands as doctor automatically on first sign-in.
- [ ] Upload a rubric PDF → **Extract from PDF** → review/edit → save → **Re-analyze
  with current rubric** on a meal reflects it.
- [ ] Patterns page: coverage, plant-variety/colour tiles, protein/fiber charts,
  streak — populated after a few readings, and shows the friendly empty state before that.
- [ ] "Try something new" / "In your pantry" suggestions appear on a nutrient gap.
- [ ] **Pantry** (`docs/PLAN.md`'s Post-demo #1, all new this session):
  - [ ] Add an item manually, mark it used up, confirm it lands on the grocery list.
  - [ ] **Photo scan**: snap a pantry/fridge photo → confirm identified items → edit
    before saving.
  - [ ] **Voice capture**: on Chrome/Android, the in-page mic works; on iPhone/iPad
    (any browser — Safari, DuckDuckGo, etc.), confirm the fallback textarea
    auto-focuses and the iOS keyboard's own dictation mic works when tapped.
- [ ] Grocery list: manual add, check off, "Worth adding" suggestions.
- [ ] **Seed demo data** / **Clear demo data** on the Patients page (with `DEMO_MODE=true`)
  — see `docs/DEMO.md` for the full walkthrough script once this works.
- [ ] Google login works on the actual prod domain (this is what step 3's authorized-domain
  step is for — if it fails, that's the first thing to check).
- [ ] PWA installs as "Dr. K's Kitchen" with cream/terracotta icons; camera capture works
  for meal photos.
- [ ] Preview mode (no env vars at all) still shows the full mock experience — worth
  reconfirming on a separate throwaway deployment or just locally with `.env` removed.
- [ ] **Nutrient panel expansion** (docs/PLAN.md's Post-demo milestone #2, new this
  session): log a real meal photo and confirm the reading covers the full ~27-nutrient
  set sensibly (not just the original 9), selenium appears normally, and Detailed
  mode's per-nutrient ranges stay wide/honest rather than falsely precise. Then check
  actual token usage/latency in the Anthropic dashboard or response metadata and adjust
  `max_tokens`/`ANALYSIS_TIMEOUT_MS` in `src/lib/meals.functions.ts` if needed — both
  were raised/estimated without a live call to measure against.

## What's genuinely blocked vs. what to just try

Everything above is blocked on you, specifically — I have no Vercel account, no
Firebase project, no Anthropic billing, and (in this sandbox) no way to open a real
browser at all. There's nothing further for me to build until real accounts exist;
once they do, tell me what breaks in the verification pass above and I'll fix it.
