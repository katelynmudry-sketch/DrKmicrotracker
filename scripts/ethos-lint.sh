#!/usr/bin/env bash
# Cheap CI guard for the hard rules in CLAUDE.md: no calorie/kcal/score/grade
# concepts in product code. A few files legitimately *discuss* these terms to
# define and enforce the exclusion (the schema, the prompt spine, the engine)
# — everything else in src/ should never need to mention them.
set -euo pipefail

ALLOWLIST=(
  "src/lib/analysis.schema.ts"
  "src/lib/clinical-spine.ts"
  "src/lib/meals.functions.ts"
)

PATTERN='calorie|kcal|\bscore\b|\bgrade\b'

is_allowlisted() {
  local file="$1"
  for allowed in "${ALLOWLIST[@]}"; do
    [[ "$file" == "$allowed" ]] && return 0
  done
  return 1
}

violations=0
while IFS= read -r -d '' file; do
  if is_allowlisted "$file"; then
    continue
  fi
  if grep -inE "$PATTERN" "$file" >/dev/null; then
    echo "ethos-lint: forbidden term in $file:"
    grep -inE "$PATTERN" "$file" | sed 's/^/  /'
    violations=1
  fi
done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0)

if [[ "$violations" -ne 0 ]]; then
  echo ""
  echo "See CLAUDE.md's hard rules and docs/ETHOS.md — this app never adds" \
       "calories, calorie math, or a numeric/letter/colour-coded score or grade."
  exit 1
fi

echo "ethos-lint: clean"
