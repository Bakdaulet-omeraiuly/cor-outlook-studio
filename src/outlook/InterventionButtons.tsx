"use client";
// Intervention toggle buttons for the treatment scenarios, built from the vendored
// engine catalog. Cumulative, order-independent (the engine sorts ids). Buttons with
// no verified effect for the organ are disabled with the one-line reason; the ⓘ holds
// the citation, population, follow-up and the "modelled time course" note. Suggested
// ids get a subtle ring (assistant hook) — never the accent colour.
import { listInterventions, getInterventionEffects, type OrganId, type EvidenceGrade } from "@/domain/interventions";
import { Button, InfoTip, Pill } from "@/components/ui/primitives";

const GRADE_TONE: Record<EvidenceGrade, "ok" | "info" | "warn"> = { A: "ok", B: "info", C: "warn" };

interface ButtonModel {
  id: string;
  label: string;
  kind: "drug" | "lifestyle";
  grade: EvidenceGrade;
  verified: boolean;
  reason?: string;
  info: {
    parameterId: string;
    verified: boolean;
    grade: EvidenceGrade;
    population: string;
    citation: string;
    followUpYears?: number;
    durability?: string;
    note?: string;
  }[];
}

function fmtCitation(c: { authors: string; year: number; journal: string; doi?: string; trial?: string }): string {
  const parts = [`${c.authors} (${c.year}). ${c.journal}.`];
  if (c.trial) parts.push(`Trial: ${c.trial}.`);
  if (c.doi) parts.push(`DOI: ${c.doi}`);
  return parts.join(" ");
}

export function buildButtonModels(organ: OrganId): ButtonModel[] {
  return listInterventions(organ).map((iv) => {
    const effs = getInterventionEffects(organ, iv.id)?.effects ?? [];
    const verified = effs.some((e) => e.verified);
    return {
      id: iv.id,
      label: iv.label,
      kind: iv.kind,
      grade: iv.evidenceGrade,
      verified,
      reason: verified
        ? undefined
        : effs.length === 0
          ? `No modelled effect for the ${organ}.`
          : `No independently verified effect for the ${organ} — excluded rather than estimated.`,
      info: effs.map((e) => ({
        parameterId: e.parameterId,
        verified: e.verified,
        grade: e.evidenceGrade,
        population: e.population,
        citation: fmtCitation(e.citation),
        followUpYears: e.followUpYears,
        durability: e.durability,
        note: e.note,
      })),
    };
  });
}

function InterventionButton({ b, on, suggested, onToggle }: { b: ButtonModel; on: boolean; suggested: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-stretch gap-1">
      <Button
        size="sm"
        pressed={on}
        disabled={!b.verified}
        onClick={onToggle}
        title={b.reason}
        aria-describedby={suggested ? `sugg-${b.id}` : undefined}
        className={suggested ? "ring-1 ring-info/70 ring-offset-1 ring-offset-panel" : undefined}
        data-testid={`tx-btn-${b.id}`}
        data-on={on ? "1" : "0"}
      >
        <span className="truncate">{b.label}</span>
        <Pill tone={GRADE_TONE[b.grade]} title={`Evidence grade ${b.grade}`}>{b.grade}</Pill>
      </Button>
      <InfoTip label={`Evidence for ${b.label}`} align="right">
        {suggested && <span id={`sugg-${b.id}`} className="mb-1 block text-info">Suggested intervention.</span>}
        {!b.verified && <span className="mb-1 block text-warn">{b.reason}</span>}
        <ul className="space-y-1">
          {b.info.map((e, i) => (
            <li key={i}>
              <span className="text-ink">{e.parameterId}</span> — grade {e.grade}.{" "}
              {e.verified ? (
                <>
                  {e.citation} Population: {e.population}.
                  {e.followUpYears != null && (
                    <> Measured at {e.followUpYears} y follow-up{e.durability === "held" ? "; modelled time course (held after)." : "."}</>
                  )}
                </>
              ) : (
                <span className="text-warn">unverified / excluded{e.note ? `: ${e.note}` : "."}</span>
              )}
            </li>
          ))}
        </ul>
      </InfoTip>
    </div>
  );
}

export function InterventionButtons({
  organ,
  selected,
  suggested,
  onToggle,
}: {
  organ: OrganId;
  selected: string[];
  suggested: string[];
  onToggle: (id: string) => void;
}) {
  const models = buildButtonModels(organ);
  const drugs = models.filter((m) => m.kind === "drug");
  const lifestyle = models.filter((m) => m.kind === "lifestyle");
  const group = (title: string, items: ButtonModel[]) => (
    <div>
      <h3 className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((b) => (
          <InterventionButton key={b.id} b={b} on={selected.includes(b.id)} suggested={suggested.includes(b.id)} onToggle={() => onToggle(b.id)} />
        ))}
      </div>
    </div>
  );
  return (
    <div data-testid="intervention-buttons">
      {group("Drugs", drugs)}
      {group("Lifestyle", lifestyle)}
    </div>
  );
}
