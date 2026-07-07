# The Ethos — what Dr. K's Kitchen believes

This is not a calorie counter. It is the opposite of one.

Every screen, every AI prompt, every chart in this app is governed by Dr. Katelyn
Mudry's clinical philosophy — drawn from her "Eating More Plants" practice material,
the three design drafts (`design-drafts/`), and the product backlog in `TODO.md`.
Read this before writing a prompt, a component, or a line of copy that touches a
meal, a nutrient, or a patient.

## The seven principles

1. **No calories. Anywhere. Ever.** Never counted, displayed, stored, or charted.
   The story is what a meal *gives you* — micronutrients, protein, fiber, colour,
   variety. Calorie math is precisely the thing this app exists to replace.

2. **No grades.** No 1–10 scores, no red/yellow/green verdicts, no letter grades.
   *"Without scores designed to shame."* Protocol fit is expressed qualitatively
   ("Aligned"), never numerically — a number invites comparison and shame in a way
   a sentence doesn't. This is absolute; there is no exception for protocol fit.

   In **Detailed mode** (an explicit toggle a patient can opt out of back to
   Simple — see `docs/VOICE.md`), a micronutrient reading may also show an
   honest, wide, approximate range in mg/mcg — e.g. "Iron: Present · ~3–5mg" —
   optionally grounded by a familiar sized object (a spoon, a coin, a card, a
   hand) visible in the meal photo. This is different in kind from a grade: a
   range doesn't rank or compare, it just answers "roughly how much," the same
   job `protein_g`/`fiber_g` have quietly done in `building_blocks` since the
   schema shipped. The range must stay wide and clearly approximate — never a
   single decimal figure presented as exact; database math on a photo-guessed
   portion is still fake precision if it claims false certainty. Simple mode —
   today's tier-only behavior — remains available and never shows a number.

   A second, similarly narrow exception: the **Nutrient Profile** (today's
   rollup across a patient's logged meals, `src/lib/nutrient-profile.ts`) may
   show a percentage per nutrient in Detailed mode, against a general adult
   reference value — always captioned as a rough population-average estimate,
   never personalized (the app collects no age, sex, or weight). This still
   answers "how much," not "how good" — it never ranks the patient, never
   compares patients to each other, and is capped in display at "100%+" so an
   overage never reads as "you exceeded" (this app never uses limit language).
   Simple mode shows the same data as three qualitative bands instead. Sodium
   is deliberately not part of this or any nutrient list here — see principle
   3.

3. **Micronutrients are the plot.** As of this writing, the tracked list is a
   full nutrition-label-style set: minerals (iron — + the vitamin C pairing
   rule, zinc, magnesium, calcium — food-first, she rarely recommends
   supplements, iodine, selenium, phosphorus, potassium, copper, manganese,
   chromium, molybdenum), fat-soluble vitamins (D, A, E, K, omega-3/ALA),
   B-vitamins (B12, choline, thiamin, riboflavin, niacin, B6, folate, biotin,
   pantothenic acid), and vitamin C — plus protein (grams matter — "protein at
   every meal is a hormonal intervention") and fiber. Selenium was previously a
   hard, standing exclusion; that exclusion has been deliberately reversed on
   Dr. K's direction — it's now tracked like any other nutrient, no
   special-casing. Sodium is deliberately *not* tracked: it's a "limit"
   nutrient, and this app only ever answers "how much are you getting," never
   "how much is too much" — a different kind of feature, not a small addition.

   Not every nutrient matters equally to every patient. **Focus nutrients**
   are the doctor's current clinical emphasis for a given patient — set by Dr.
   K per patient, further tunable by the patient themselves — and are what's
   pinned and emphasized on a reading; see principle 7. The AI still evaluates
   every tracked nutrient on every reading regardless of focus — focus changes
   emphasis, never completeness.

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
