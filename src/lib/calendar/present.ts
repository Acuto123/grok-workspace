import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";

export type When = {
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  repeat?: string | null;
};

export const REPEAT_RULES = ["none", "daily", "weekly", "biweekly", "monthly", "yearly"] as const;
export type RepeatRule = (typeof REPEAT_RULES)[number];

export const REPEAT_OPTIONS: { id: RepeatRule; label: string }[] = [
  { id: "none", label: "Nie powtarza się" },
  { id: "daily", label: "Codziennie" },
  { id: "weekly", label: "Co tydzień" },
  { id: "biweekly", label: "Co 2 tygodnie" },
  { id: "monthly", label: "Co miesiąc" },
  { id: "yearly", label: "Co rok" },
];

export function isRepeatRule(value: string): value is RepeatRule {
  return (REPEAT_RULES as readonly string[]).includes(value);
}

export function repeatLabel(rule: string | null | undefined): string {
  return REPEAT_OPTIONS.find((item) => item.id === rule)?.label ?? REPEAT_OPTIONS[0].label;
}

export const EVENT_COLORS: { id: string; label: string }[] = [
  { id: "", label: "Bez koloru" },
  { id: "#1c1917", label: "Atrament" },
  { id: "#4cc38a", label: "Zielony" },
  { id: "#ff6b6b", label: "Czerwony" },
  { id: "#5aa9ff", label: "Niebieski" },
  { id: "#b388ff", label: "Fioletowy" },
  { id: "#ffd54a", label: "Żółty" },
];

// Dawne, ciemniejsze kolory zapisane w istniejących wydarzeniach → jaśniejsze odpowiedniki.
const LEGACY_COLORS: Record<string, string> = {
  "#2c4a3e": "#4cc38a",
  "#8c4a3a": "#ff6b6b",
  "#3d5a73": "#5aa9ff",
  "#3e5c5a": "#b388ff",
  "#6b5344": "#ffd54a",
};

export function eventColor(color: string | null | undefined): string {
  if (!color) return "";
  return LEGACY_COLORS[color.toLowerCase()] ?? color;
}

export const COLOR_IDS = new Set([
  ...EVENT_COLORS.map((c) => c.id),
  ...Object.keys(LEGACY_COLORS),
]);

export const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"] as const;

export function todayIso(now = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

export function monthCursor(now = new Date()): string {
  return format(startOfMonth(now), "yyyy-MM-dd");
}

export function shiftMonth(cursor: string, delta: number): string {
  return format(addMonths(parseISO(cursor), delta), "yyyy-MM-dd");
}

export function monthTitle(cursor: string): string {
  const label = format(parseISO(cursor), "LLLL yyyy", { locale: pl });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayTitle(iso: string): string {
  const label = format(parseISO(iso), "EEEE, d MMMM", { locale: pl });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthCells(cursor: string): string[] {
  const start = startOfWeek(startOfMonth(parseISO(cursor)), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(parseISO(cursor)), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  while (days.length < 42) {
    const tail = days[days.length - 1];
    days.push(new Date(tail.getFullYear(), tail.getMonth(), tail.getDate() + 1));
  }
  return days.slice(0, 42).map((d) => format(d, "yyyy-MM-dd"));
}

export function sameMonth(iso: string, cursor: string): boolean {
  return iso.slice(0, 7) === cursor.slice(0, 7);
}

export function eventDays(event: When): string[] {
  const start = event.startDate || event.endDate;
  const end = event.endDate || event.startDate;
  if (!start || !end) return [];
  if (end < start) return [start];
  const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
  if (days.length > 370) return [start];
  return days.map((d) => format(d, "yyyy-MM-dd"));
}

function ruleOf(event: When): RepeatRule {
  const value = event.repeat ?? "none";
  return isRepeatRule(value) ? value : "none";
}

function anchorOf(event: When): string | null {
  return event.startDate || event.endDate || null;
}

function spanDays(event: When): number {
  const anchor = anchorOf(event);
  if (!anchor) return 0;
  const end = event.endDate && event.endDate >= anchor ? event.endDate : anchor;
  const span = differenceInCalendarDays(parseISO(end), parseISO(anchor));
  return span < 0 ? 0 : Math.min(span, 366);
}

function isOccurrenceStart(anchorIso: string, candidateIso: string, rule: RepeatRule): boolean {
  if (candidateIso < anchorIso) return false;
  if (rule === "none") return candidateIso === anchorIso;
  const anchor = parseISO(anchorIso);
  const candidate = parseISO(candidateIso);
  const diff = differenceInCalendarDays(candidate, anchor);
  if (diff < 0) return false;
  if (rule === "daily") return true;
  if (rule === "weekly") return diff % 7 === 0;
  if (rule === "biweekly") return diff % 14 === 0;
  if (rule === "monthly") {
    const months =
      (candidate.getFullYear() - anchor.getFullYear()) * 12 +
      (candidate.getMonth() - anchor.getMonth());
    if (months < 0) return false;
    return format(addMonths(anchor, months), "yyyy-MM-dd") === candidateIso;
  }
  const years = candidate.getFullYear() - anchor.getFullYear();
  if (years < 0) return false;
  return format(addYears(anchor, years), "yyyy-MM-dd") === candidateIso;
}

export function coversDay(event: When, iso: string): boolean {
  return occurrenceOn(event, iso) !== null;
}

export function occurrenceOn(event: When, iso: string): { start: string; end: string } | null {
  const anchor = anchorOf(event);
  if (!anchor) return null;
  const rule = ruleOf(event);
  const span = spanDays(event);
  if (rule === "none") {
    const end = event.endDate && event.endDate >= anchor ? event.endDate : anchor;
    if (iso < anchor || iso > end) return null;
    return { start: anchor, end };
  }
  const day = parseISO(iso);
  for (let back = 0; back <= span; back += 1) {
    const startIso = format(addDays(day, -back), "yyyy-MM-dd");
    if (startIso < anchor) continue;
    if (isOccurrenceStart(anchor, startIso, rule)) {
      return { start: startIso, end: format(addDays(parseISO(startIso), span), "yyyy-MM-dd") };
    }
  }
  return null;
}

export function sameSlot(
  proposal: When,
  draft: { startDate: string; endDate: string; startTime: string; endTime: string },
): boolean {
  const start = proposal.startDate ?? "";
  const end = proposal.endDate ?? "";
  const draftEnd = draft.endDate || draft.startDate;
  return (
    start === draft.startDate &&
    (end || start) === (draftEnd || draft.startDate) &&
    (proposal.startTime ?? "") === draft.startTime &&
    (proposal.endTime ?? "") === draft.endTime
  );
}

export function formatWhen(event: When, onDay?: string): string {
  const occ = onDay ? occurrenceOn(event, onDay) : null;
  const startDate = occ?.start ?? event.startDate;
  const endDate = occ?.end ?? event.endDate;
  const day = (iso: string) => format(parseISO(iso), "d MMM", { locale: pl }).replace(/\./g, "");
  const span =
    startDate && endDate && endDate !== startDate
      ? `${day(startDate)} – ${day(endDate)}`
      : startDate
        ? day(startDate)
        : endDate
          ? day(endDate)
          : "";
  const time =
    event.startTime && event.endTime
      ? `${event.startTime}–${event.endTime}`
      : event.startTime
        ? `od ${event.startTime}`
        : event.endTime
          ? `do ${event.endTime}`
          : "";
  const repeat = ruleOf(event) === "none" ? "" : repeatLabel(ruleOf(event)).toLowerCase();
  const parts = [span, time, repeat].filter(Boolean);
  return parts.join(" · ") || "Bez terminu";
}

export function eventTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || "Bez nazwy";
}

export function plCount(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const m10 = abs % 10;
  const m100 = abs % 100;
  const word =
    abs === 1 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  return `${n} ${word}`;
}

export function errorText(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  if (/unauthorized/i.test(raw)) return "Sesja wygasła. Zaloguj się ponownie.";
  if (
    /nie |podaj |koniec |możesz |nieprawid|nie znaleziono|nie udało|hasło|konto|e-mail|email/i.test(
      raw,
    )
  ) {
    return raw;
  }
  return "Nie udało się zapisać. Spróbuj jeszcze raz.";
}
