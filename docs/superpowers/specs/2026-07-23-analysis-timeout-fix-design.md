# Fix: Claude analysis reliably times out

## Problem

Logging a meal (real or preview) calls Claude with `tool_choice` forced to
`record_meal_reading`, requesting a full structured reading across all ~27
tracked nutrients plus narrative fields (opening note, worth trying,
absorption notes, protocol fit). Measured against the real API, a single full
reading takes **~44s** (2,752 output tokens). `ANALYSIS_TIMEOUT_MS` in
`src/lib/analysis-engine.ts` is currently `25_000`, and a failed first
attempt triggers one automatic corrective retry — so the current design
requires two ~44s calls to both complete inside a 25s+25s client budget that
neither can meet. Every reading times out.

## Root cause

`ANALYSIS_TIMEOUT_MS` was an unmeasured estimate (see the comment at
`analysis-engine.ts:56-61`) sized against a 60s Vercel `maxDuration`, on the
assumption that most attempts would be short and the retry was for occasional
bad output. In practice every attempt is ~44s, so the retry design can never
fit its own budget.

## Fix (priority: reliability, simplest viable change — no new infra)

1. **Raise `ANALYSIS_TIMEOUT_MS`** from `25_000` to `55_000` — headroom over
   the measured ~44s without being unreasonable.
2. **Drop the automatic corrective retry** in `runAnalysisModel`
   (`analysis-engine.ts`). A bad-schema retry doubles worst-case wall time
   (44s + 44s ≈ 88s), which is what actually makes this unfixable within a
   single-attempt-sized budget. The schema bug that caused most past
   failures (the `estimation_basis` nullable-enum issue) is already fixed,
   so a genuine validation failure on a *forced* tool call should now be
   rare. On failure, the flow degrades to today's existing manual-retry UX:
   the patient/tester sees a clear error toast and can resubmit — same
   pattern already used when the real (Firestore) flow's analysis fails.
3. **Raise `maxDuration`** in `vite.config.ts`'s `nitro(...)` vercel preset
   config from `60` to `90`, to comfortably fit one ~44s attempt plus
   upload/network overhead. This requires the deployed Vercel project's plan
   to support a `maxDuration` above 60s (Hobby caps at 60s; Pro allows more)
   — flagged as an owner-verification step in `docs/OWNER-TODO.md` since it
   can't be confirmed from the repo.
4. **Add prompt caching** on the system prompt built by
   `buildSystemPrompt()` in `clinical-spine.ts`, via Anthropic's
   `cache_control: { type: "ephemeral" }` on that content block. Reduces
   cost and shaves some latency on repeat calls (helpful since the same
   system prompt is sent on every reading).
5. **Trim output verbosity** slightly in the prompt instructions for
   `worth_trying` and `absorption_notes` (tighter length guidance) to shave
   some output tokens and add a bit more margin under the new timeout — a
   minor assist, not the primary fix.

## Out of scope (considered, rejected for this pass)

- **Async pending/poll pattern for preview mode** (matching the real
  Firestore-backed flow): the strongest long-term fix, but preview mode has
  no database to hold in-flight job state between polls, and introducing one
  (Vercel KV/Redis, or an in-memory job map that's unsafe across serverless
  instances) is new infrastructure — out of scope for "simplest, make it
  work now."
- **Streaming responses**: doesn't reduce actual generation time, only
  perceived wait; deferred since a non-streaming fix is enough to make
  requests reliably complete.
- **Parallel-split calls** (nutrients vs. narrative fields concurrently):
  real latency win, but doubles per-reading API calls/cost and adds
  merge/retry complexity — deferred.
- **Cheaper/faster model (e.g. Haiku)**: quality trade-off on a
  clinical-facing tool; not pursued without Dr. K's sign-off.

## Files touched

- `src/lib/analysis-engine.ts` — timeout value, drop retry
- `vite.config.ts` — `maxDuration`
- `src/lib/clinical-spine.ts` — prompt caching, trimmed length guidance
- `docs/OWNER-TODO.md` — note Vercel plan `maxDuration` check

## Testing

- Re-run the local repro script style test (full schema, real API call) to
  confirm a single attempt completes and validates within the new timeout.
- `npm run typecheck && npm run lint && npm run build`.
- Manually log a text meal and a photo meal locally end-to-end.
