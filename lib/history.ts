import { EntryDTO } from "./types";

// Layer-0 conditions & procedures are stored as Entry rows with these itemKey
// prefixes, e.g. "procedure.heller_myotomy" / "condition.achalasia".
export const CONDITION_PREFIX = "condition.";
export const PROCEDURE_PREFIX = "procedure.";

export interface HistoryEvent {
  id: string;
  slug: string;
  label: string;
  date: string; // ISO
  note?: string | null;
  status?: string | null;
}

export interface MedicalHistory {
  conditions: HistoryEvent[];
  procedures: HistoryEvent[];
}

/** Group a person's condition/procedure entries into a newest-first history. */
export function buildHistory(entries: EntryDTO[]): MedicalHistory {
  const toEvent = (e: EntryDTO, prefix: string): HistoryEvent => ({
    id: e.id,
    slug: e.itemKey.slice(prefix.length),
    label: e.label || e.valueText || e.itemKey.slice(prefix.length),
    date: e.performedAt,
    note: e.notes,
    status: e.status,
  });
  const byDate = (a: HistoryEvent, b: HistoryEvent) => +new Date(b.date) - +new Date(a.date);
  return {
    conditions: entries
      .filter((e) => e.itemKey.startsWith(CONDITION_PREFIX))
      .map((e) => toEvent(e, CONDITION_PREFIX))
      .sort(byDate),
    procedures: entries
      .filter((e) => e.itemKey.startsWith(PROCEDURE_PREFIX))
      .map((e) => toEvent(e, PROCEDURE_PREFIX))
      .sort(byDate),
  };
}
