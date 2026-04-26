import { CheckCircle2, Circle } from "lucide-react";
import type { PersonaTraitOption } from "./types";

export function PersonaTraitCard(props: {
  option: PersonaTraitOption;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const { option, selected, onToggle } = props;

  return (
    <button
      type="button"
      onClick={() => onToggle(option.id)}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
      }`}
    >
      <p className="text-sm font-semibold">{option.label}</p>
      <p className={`mt-1 text-xs ${selected ? "text-zinc-200" : "text-zinc-600"}`}>{option.description}</p>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
        {selected ? "Selected" : "Not selected"}
      </div>
    </button>
  );
}
