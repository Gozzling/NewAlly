import type { RecordValidation } from "@ally/shared-types";

type Props = {
  validation: RecordValidation;
  compact?: boolean;
};

export function MatchRecordValidation({ validation, compact = false }: Props) {
  if (validation.valid && validation.completeness >= 85) return null;

  const errors = validation.issues.filter((i) => i.severity === "error");
  const warns = validation.issues.filter((i) => i.severity === "warn");
  const headline =
    errors.length > 0
      ? errors[0].message
      : warns.length > 0
        ? warns[0].message
        : `Data ${validation.completeness}% complete`;

  const tone =
    errors.length > 0
      ? "border-ally-error/40 bg-ally-error/10 text-ally-text"
      : "border-ally-warning/40 bg-ally-warning/10 text-ally-muted";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${tone} border`}
        title={validation.issues.map((i) => i.message).join(" · ")}
      >
        {validation.completeness}%
      </span>
    );
  }

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-ally-text">Incomplete match data</span>
        <span className="font-mono text-[10px] tabular-nums">{validation.completeness}%</span>
      </div>
      <p className="mt-1 text-ally-muted">{headline}</p>
      {validation.issues.length > 1 && (
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-ally-muted">
          {validation.issues.slice(0, 4).map((i) => (
            <li key={`${i.code}-${i.field}`}>{i.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
