// A flat multi-select checkbox list — same interaction pattern as
// FocusNutrientPicker's checkboxes, minus the nutrient grouping. Shared by
// any Settings picker over a fixed string option list (e.g. the region and
// food heritage pickers).
export function CheckboxOptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  const toggle = (option: T) => {
    onChange(value.includes(option) ? value.filter((o) => o !== option) : [...value, option]);
  };

  return (
    <div className="grid gap-1 sm:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.includes(option)}
            onChange={() => toggle(option)}
            className="h-4 w-4 rounded border-input"
          />
          {option}
        </label>
      ))}
    </div>
  );
}
