# Voice — vocabulary, copy bank, and examples

The UI and the AI prompt draw their language from this single source (the
"Blend" system). If you're writing patient-facing copy or editing the prompt
spine in `src/lib/clinical-spine.ts`, use these words — don't improvise
synonyms that drift back toward clinical or calorie-counter language.

See `docs/ETHOS.md` for the principles behind these choices.

## Vocabulary table

| Concept | The word |
|---|---|
| The analysis | **a reading** |
| What it contains | **What this meal offered** |
| Suggestions | **Worth trying** |
| Doctor's notes | **Notes from Dr. K** |
| Rubric fit | **Protocol fit: Aligned / Getting there / Worth a look** (qualitative — final tier labels tuned with Katelyn) |
| Micronutrient levels | **Strong source / Present / A little light** (the headline tier — always shown first) |
| A nutrient's real amount | a plain number with its unit, e.g. **"about 6.6mg"** — detail under the tier, never the headline |
| Progress toward a target | **"about two-thirds of a typical day's target"** — never "% RDI" or clinical target-tracking language |
| Uncertainty | "We couldn't quite see…" |
| Trends page | **Patterns** |
| Gap suggestions | "In your pantry" / "Try something new" |

## Microcopy bank (preserve verbatim)

- "Snap your meal, get a little love note from your body."
- "This bowl is doing exactly what we hoped for your energy this week — nice work!"
- "No spreadsheets, no guilt, no clinical coldness — just gentle clarity between visits."
- "See trends over weeks, not just one snapshot — without judgment, just information."
- "Without scores designed to shame."
- "Three steps, zero stress."
- "Considered, not clinical."
- "Food is medicine — but only when you can actually see what it's doing for you."
  — Dr. Katelyn Mudry, ND

## Do / don't

| Don't | Do |
|---|---|
| "You exceeded your sugar target." | "This one leaned sweet — worth pairing with protein next time." |
| "Rubric score: 6/10" | "Protocol fit: Getting there" |
| "320 kcal, 12g protein" | "A strong source of protein, present fiber" |
| "Low iron — warning" | "Iron's a little light this week — pumpkin seeds or blackstrap molasses would help" |
| "Selenium: low" | (never mention selenium) |
| "You forgot your vegetables" | "Worth trying: adding a plant at this meal" |
| Red/yellow/green badges | Plain qualitative tiers, no colour-as-verdict |
| "Iron: low" (bare number, no context) | "Iron's a little light today — about 3mg, roughly a third of a typical day's target. Pumpkin seeds or blackstrap molasses would help close the gap." |
| "You're at 33% of your RDI" | "About a third of the way to a typical day's target" |

## Style notes

- One warm opening line per reading (the "love note" moment), then quiet, clear
  detail — don't stack multiple exclamation points or cheerful lines back to back.
- Emoji sparing — none by default; never used to signal a verdict (no traffic-light
  emoji, no warning symbols).
- First-person-plural ("we," "let's") where it reads naturally; avoid
  second-person imperatives that read as instructions from an app rather than
  notes from a clinician.
- When uncertain (blurry photo, ambiguous description), say so plainly —
  "We couldn't quite see…" — never guess silently or overstate confidence.
