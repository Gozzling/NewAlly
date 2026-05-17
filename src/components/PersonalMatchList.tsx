import type { EnrichedMatch } from "@ally/shared-types";
import { MatchRecordValidation } from "@/components/MatchRecordValidation";

type Props = {
  rows: EnrichedMatch[];
  limit?: number;
};

export function PersonalMatchList({ rows, limit = 20 }: Props) {
  return (
    <div className="space-y-2 max-h-72 overflow-auto pr-1">
      {rows.slice(0, limit).map((row) => {
        const m = row.match;
        return (
          <div key={m.id} className="bg-ally-bg border border-ally-border rounded-lg p-3">
            <div className="flex items-center justify-between text-xs gap-2">
              <div className="text-ally-text">
                Place: <span className="text-ally-accent font-semibold">{m.placement ?? "-"}</span>
                {" · "}
                Comp: <span className="text-ally-muted">{m.compLabel ?? "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <MatchRecordValidation validation={row.validation} compact />
                <span className="text-ally-muted">{new Date(m.playedAt).toLocaleString()}</span>
              </div>
            </div>
            {!row.validation.valid && (
              <div className="mt-2">
                <MatchRecordValidation validation={row.validation} />
              </div>
            )}
            <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-ally-muted">
              <div>
                Units:{" "}
                {m.units
                  .slice(0, 4)
                  .map((u) => `${u.displayName}${u.starLevel ? ` ★${u.starLevel}` : ""}`)
                  .join(", ")}
                {m.units.length > 4 ? ` +${m.units.length - 4}` : ""}
              </div>
              {m.summonerName && <div>Summoner: {m.summonerName}</div>}
              {m.region && <div>Region: {m.region.toUpperCase()}</div>}
              {m.augments.length > 0 && (
                <div>Augments: {m.augments.map((a) => a.displayName).join(", ")}</div>
              )}
            </div>
            {m.units.some((u) => u.items.length > 0) && (
              <div className="mt-1 text-[10px] text-ally-muted">
                Items:{" "}
                {m.units
                  .filter((u) => u.items.length > 0)
                  .slice(0, 3)
                  .map((u) => `${u.displayName} (${u.items.map((i) => i.displayName).join("/")})`)
                  .join(" · ")}
              </div>
            )}
            {m.syncStatus && (
              <div className="mt-1 text-[10px] flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded ${
                    m.syncStatus === "synced"
                      ? "bg-ally-success"
                      : m.syncStatus === "failed"
                        ? "bg-ally-error"
                        : "bg-ally-warning"
                  }`}
                />
                <span className="text-ally-muted">
                  {m.syncStatus === "synced"
                    ? "Synced"
                    : m.syncStatus === "failed"
                      ? "Failed"
                      : "Pending"}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
