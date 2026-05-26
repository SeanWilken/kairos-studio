import { Badge, Card, CardContent, CardHeader, CardTitle } from "@myai-tech/myui";
import type { PersonaBuilderValues } from "./types";

export function PersonaResumePreview(props: {
  values: PersonaBuilderValues;
  systemPrompt: string;
}) {
  const { values, systemPrompt } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resume Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-xl font-semibold text-zinc-900">{values.name || "Unnamed Persona"}</p>
          <p className="text-zinc-600">{values.role || "Role not set"}</p>
          {values.headline ? <p className="mt-1 text-zinc-700">{values.headline}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border p-2">
            <p className="text-xs text-zinc-500">Industry</p>
            <p className="font-medium text-zinc-800">{values.industry || "-"}</p>
          </div>
          <div className="rounded border p-2">
            <p className="text-xs text-zinc-500">Model</p>
            <p className="font-medium text-zinc-800">{values.modelProfile || "-"}</p>
          </div>
          <div className="rounded border p-2">
            <p className="text-xs text-zinc-500">Communication</p>
            <p className="font-medium text-zinc-800">{values.communicationStyle}</p>
          </div>
          <div className="rounded border p-2">
            <p className="text-xs text-zinc-500">Initiative</p>
            <p className="font-medium text-zinc-800">{values.initiativeLevel}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-zinc-500">Traits</p>
          <div className="flex flex-wrap gap-1.5">
            {values.traits.length === 0 ? <Badge variant="outline">None selected</Badge> : values.traits.map((trait) => <Badge key={trait} variant="outline">{trait}</Badge>)}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-zinc-500">System Prompt</p>
          <pre className="max-h-52 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">{systemPrompt || "Prompt preview will appear here."}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
