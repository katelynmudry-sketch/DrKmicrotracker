# The Ethos — what Dr. K's Kitchen believes

This is not a calorie counter. It is the opposite of one.

Every screen, every AI prompt, every chart in this app is governed by Dr. Katelyn
Mudry's clinical philosophy — drawn from her "Eating More Plants" practice material,
the three design drafts (`design-drafts/`), and the product backlog in `TODO.md`.
Read this before writing a prompt, a component, or a line of copy that touches a
meal, a nutrient, or a patient.

## The eight principles

1. **No calories. Anywhere. Ever.** Never counted, displayed, stored, or charted.
   The story is what a meal *gives you* — micronutrients, protein, fiber, colour,
   variety. Calorie math is precisely the thing this app exists to replace.

2. **No grades.** No 1–10 scores, no red/yellow/green verdicts, no letter grades.
   *"Without scores designed to shame."* Protocol fit is expressed qualitatively
   ("Aligned"), never numerically — a number invites comparison and shame in a way
   a sentence doesn't.

3. **Micronutrients are the plot.** The nutrients that matter, in her clinical
   experience: iron (+ the vitamin C pairing rule), B12, vitamin D, calcium
   (food-first — she rarely recommends supplements), omega-3/ALA, iodine, zinc,
   choline, magnesium, protein (grams matter — "protein at every meal is a
   hormonal intervention"), fiber. **Never flag selenium** — this is her explicit,
   standing clinical position; treat it as a hard exclusion, not an oversight.

4. **Absorption intelligence is the superpower.** No other nutrition app does
   this — it's the differentiator: vitamin C alongside iron; coffee/tea kept an
   hour away from iron-rich meals; cooked (not raw) brassicas for Hashimoto's
   patients; oxalates vs. spinach's calcium; phytates and soaking/sprouting for
   zinc absorption; carminative spices paired with beans. These surface as gentle,
   specific tips tied to the actual meal in front of the patient, not generic
   nutrition trivia.

5. **Cravings and gaps are data, not sins.** A low-iron week suggests pumpkin
   seeds and blackstrap molasses. A chocolate craving is often iron and magnesium
   talking, not a willpower failure. Frame every gap as useful signal, never as
   something to confess.

6. **Plant-forward, not plant-policing.** Celebrate additions — "beautiful
   colours on that plate," "12 different plants this week" — and never shame
   inclusions. The app counts what's present, never what's "wrong."

7. **The doctor's rubric is the lens; the doctor is the human in the loop.**
   Every reading is scored against *her* written protocol — "scored to YOUR plan,
   not a generic database" — and she reviews, corrects, annotates, and re-runs it.
   The AI assists her judgment; it never replaces it.

8. **Food from home is not a substitute — it's the standard.** A patient's plate
   doesn't have to be translated into a Western pantry list to be complete.
   Injera, dal, varenyky, jollof, kimchi — these carry the same iron, B12, and
   calcium the app tracks, and deserve to be recognized on sight, not converted
   into a generic analog first. The food reference (`src/lib/nutrient-reference.ts`)
   is curated across cuisines and regions, not just North American ones; a patient
   can name their own cuisine or heritage once in Settings and suggestions close to
   home lead the list from then on — quietly, as priority, never as a label the
   patient sees. When a patient's own cuisine or region isn't in the curated list
   at all, the app asks and generates a real suggestion
   (`src/lib/cultural-food.functions.ts`) rather than leaving the list empty for
   them.

## Voice rule

Warm, clinically grounded, zero judgment — like a note from your ND. One warm
opening line (the *"love note from your body"* moment), then quiet, clear detail.
Emoji sparing. First-person-plural where it reads naturally ("we," not "you
should"). See `docs/VOICE.md` for the full vocabulary and copy bank.

## Why this matters for engineering decisions

These aren't style preferences — they're the product's entire differentiation.
A calorie field or a numeric score isn't a small addition; it's a different
product that happens to share a codebase. When a feature, schema field, or
prompt seems to need one of the excluded concepts, that's a signal to find the
qualitative equivalent (see `docs/VOICE.md`'s tier language), not to add an
exception.
