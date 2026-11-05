import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import type { AppUser } from "@/lib/auth/use-current-user";
import {
  calendarQueryKey,
  listCalendar,
  type CalendarSnapshot,
  type MutationResult,
} from "@/lib/calendar/api";
import {
  WEEKDAYS,
  coversDay,
  dayTitle,
  eventColor,
  eventTitle,
  formatWhen,
  monthCells,
  monthCursor,
  monthTitle,
  plCount,
  sameMonth,
  shiftMonth,
  todayIso,
} from "@/lib/calendar/present";
import { btnInk, btnLine } from "@/components/controls";
import { InstallButton } from "@/components/install-button";
import { Mark } from "@/components/mark";
import { EventDialog } from "@/components/calendar/event-dialog";

type DialogState = { type: "create"; day: string | null } | { type: "event"; id: string };

export function CalendarScreen({ user }: { user: AppUser }) {
  const revision = useRef(0);
  const queryClient = useQueryClient();
  const agendaRef = useRef<HTMLElement>(null);
  const [cursor, setCursor] = useState(() => monthCursor());
  const [selected, setSelected] = useState(() => todayIso());
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const query = useQuery({
    queryKey: calendarQueryKey,
    queryFn: async () => {
      const started = revision.current;
      const snapshot = await listCalendar();
      if (revision.current !== started) {
        return queryClient.getQueryData<CalendarSnapshot>(calendarQueryKey) ?? snapshot;
      }
      return snapshot;
    },
    refetchInterval: 4000,
  });

  const data = query.data;
  const events = data?.events ?? [];
  const cells = useMemo(() => monthCells(cursor), [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    const days = new Set(cells);
    days.add(selected);
    for (const iso of days) {
      const list = events.filter((event) => coversDay(event, iso));
      if (list.length) map.set(iso, list);
    }
    return map;
  }, [events, cells, selected]);

  const loose = events.filter((event) => !event.startDate && !event.endDate);
  const dayEvents = byDay.get(selected) ?? [];
  const today = todayIso();

  function selectDay(iso: string) {
    setSelected(iso);
    if (!sameMonth(iso, cursor)) setCursor(`${iso.slice(0, 7)}-01`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    agendaRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  function goMonth(delta: number) {
    const next = shiftMonth(cursor, delta);
    setCursor(next);
    if (!sameMonth(selected, next)) {
      setSelected(sameMonth(today, next) ? today : next);
    }
  }

  function onResult(result: MutationResult, close: boolean) {
    revision.current += 1;
    queryClient.setQueryData(calendarQueryKey, result.snapshot);
    if (close || (dialog?.type === "event" && !result.snapshot.events.some((event) => event.id === dialog.id) && !result.focusId)) {
      setDialog(null);
      return;
    }
    if (result.focusId) setDialog({ type: "event", id: result.focusId });
  }

  const openEvent = dialog?.type === "event" ? events.find((event) => event.id === dialog.id) ?? null : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Mark />
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">Zbiórka</h1>
            <p className="text-sm text-muted">Wspólny kalendarz</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Presence people={data?.people ?? []} me={user.id} />
          <InstallButton />
          <button
            id="new-event"
            type="button"
            className={btnLine}
            onClick={() => setDialog({ type: "create", day: null })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nowe
          </button>
          <UserButton />
        </div>
      </header>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-medium md:text-3xl">{monthTitle(cursor)}</h2>
            <div className="flex gap-2">
              <button type="button" className={`${btnLine} w-11 px-0`} aria-label="Poprzedni miesiąc" onClick={() => goMonth(-1)}>
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" className={btnLine} onClick={() => { setCursor(monthCursor()); setSelected(today); }}>
                Dziś
              </button>
              <button type="button" className={`${btnLine} w-11 px-0`} aria-label="Następny miesiąc" onClick={() => goMonth(1)}>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-line">
            <div className="grid grid-cols-7 gap-px">
              {WEEKDAYS.map((day) => (
                <div key={day} className="bg-paper px-1 py-2 text-center text-xs font-medium text-faint">
                  {day}
                </div>
              ))}
              {cells.map((iso) => {
                const list = byDay.get(iso) ?? [];
                const inMonth = sameMonth(iso, cursor);
                const isSelected = iso === selected;
                const isToday = iso === today;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => selectDay(iso)}
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${dayTitle(iso)}, ${list.length} wydarzeń`}
                    className={`flex min-h-16 min-w-0 flex-col gap-1 bg-paper-2 p-1 text-left transition-colors duration-150 hover:bg-paper md:min-h-28 md:p-2 ${
                      isSelected ? "bg-paper" : ""
                    }`}
                  >
                    <span
                      className={`grid size-7 place-items-center rounded-full text-sm tabular-nums ${
                        isSelected ? "bg-ink text-paper" : isToday ? "ring-1 ring-ink" : ""
                      } ${inMonth ? "" : "text-faint"}`}
                    >
                      {Number(iso.slice(8))}
                    </span>
                    <span className="hidden min-w-0 flex-col gap-1 md:flex">
                      {list.slice(0, 3).map((event) => (
                        <span key={event.id} title={eventTitle(event.title)} className="flex min-w-0 items-center gap-1">
                          <span
                            className="h-3 w-1 shrink-0 rounded-full"
                            style={{ background: eventColor(event.color) || "var(--color-line-strong)" }}
                          />
                          <span className="truncate text-xs">{eventTitle(event.title)}</span>
                        </span>
                      ))}
                      {list.length > 3 ? (
                        <span className="text-xs text-faint">+{list.length - 3}</span>
                      ) : null}
                    </span>
                    <span className="flex gap-1 md:hidden">
                      {list.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className="size-1.5 rounded-full"
                          style={{ background: eventColor(event.color) || "var(--color-line-strong)" }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section ref={agendaRef} id="agenda" className="rounded-xl border border-line bg-paper-2 p-4 lg:col-span-2 lg:sticky lg:top-4">
          <h2 className="font-display text-2xl font-medium">{dayTitle(selected)}</h2>
          <button
            id="add-event"
            type="button"
            className={`${btnInk} mt-3 w-full`}
            onClick={() => setDialog({ type: "create", day: selected })}
          >
            <Plus className="size-4" aria-hidden="true" />
            {selected === today ? "Dodaj na dziś" : "Dodaj na ten dzień"}
          </button>

          <div className="mt-4">
            {query.isPending ? (
              <p className="text-sm text-muted">Wczytuję kalendarz…</p>
            ) : query.isError && !data ? (
              <div className="grid gap-2">
                <p className="text-sm text-danger" role="alert">Nie udało się wczytać kalendarza.</p>
                <button type="button" className={btnLine} onClick={() => void query.refetch()}>
                  Spróbuj ponownie
                </button>
              </div>
            ) : dayEvents.length === 0 ? (
              <p className="text-sm text-pretty text-muted">
                {events.length === 0
                  ? "To wspólny kalendarz. Dodaj wydarzenie — inni zagłosują na godzinę i zaznaczą, czy przyjdą. Może wracać co tydzień, miesiąc albo rok."
                  : "Tego dnia jest pusto."}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {dayEvents.map((event) => (
                  <EventRowButton
                    key={event.id}
                    event={event}
                    day={selected}
                    snapshot={data}
                    onOpen={() => setDialog({ type: "event", id: event.id })}
                  />
                ))}
              </ul>
            )}
          </div>

          {loose.length > 0 ? (
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="text-sm font-semibold">Bez terminu</h3>
              <ul className="divide-y divide-line">
                {loose.map((event) => (
                  <EventRowButton
                    key={event.id}
                    event={event}
                    snapshot={data}
                    onOpen={() => setDialog({ type: "event", id: event.id })}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      {dialog && (dialog.type === "create" || openEvent) ? (
        <EventDialog
          key={dialog.type === "create" ? `create-${dialog.day ?? "empty"}` : dialog.id}
          mode={dialog.type === "create" ? "create" : "event"}
          event={openEvent}
          proposals={data?.proposals.filter((item) => item.eventId === openEvent?.id) ?? []}
          votes={data?.votes ?? []}
          rsvps={data?.rsvps.filter((item) => item.eventId === openEvent?.id) ?? []}
          me={user.id}
          initialDay={dialog.type === "create" ? dialog.day : null}
          onClose={() => setDialog(null)}
          onResult={onResult}
        />
      ) : null}
    </main>
  );
}

function Presence({ people, me }: { people: CalendarSnapshot["people"]; me: string }) {
  const label =
    people.length === 0
      ? "Łączenie…"
      : people.every((person) => person.id === me)
        ? "Tylko ty jesteś teraz w kalendarzu"
        : `${plCount(people.length, "osoba", "osoby", "osób")} na żywo`;
  const shown = people.slice(0, 5);
  return (
    <div className="flex items-center gap-2">
      <div className="flex" aria-hidden="true">
        {shown.map((person) => (
          <span key={person.id} title={person.name} className="-ml-2 first:ml-0">
            {person.image ? (
              <img
                src={person.image}
                alt=""
                referrerPolicy="no-referrer"
                className="size-8 rounded-full border-2 border-paper object-cover"
              />
            ) : (
              <span className="grid size-8 place-items-center rounded-full border-2 border-paper bg-ink text-xs font-semibold text-paper">
                {(person.name.trim()[0] || "?").toUpperCase()}
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="flex items-center gap-1 text-xs text-muted">
        <span className="size-2 rounded-full bg-pine" aria-hidden="true" />
        {label}
      </p>
    </div>
  );
}

function EventRowButton({
  event,
  snapshot,
  day,
  onOpen,
}: {
  event: CalendarSnapshot["events"][number];
  snapshot: CalendarSnapshot | undefined;
  day?: string;
  onOpen: () => void;
}) {
  const yes = snapshot?.rsvps.filter((row) => row.eventId === event.id && row.status === "yes").length ?? 0;
  const proposals = snapshot?.proposals.filter((row) => row.eventId === event.id) ?? [];
  const top = [...proposals].sort((a, b) => {
    const count = (id: string) => snapshot?.votes.filter((vote) => vote.proposalId === id).length ?? 0;
    return count(b.id) - count(a.id);
  })[0];
  const topVotes = top ? snapshot?.votes.filter((vote) => vote.proposalId === top.id).length ?? 0 : 0;
  const meta = [
    yes > 0 ? plCount(yes, "osoba", "osoby", "osób") : "",
    top && topVotes > 0 ? `${formatWhen(top)} · ${plCount(topVotes, "głos", "głosy", "głosów")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full min-w-0 gap-3 py-3 text-left">
        <span
          className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
          style={{ background: eventColor(event.color) || "var(--color-line-strong)" }}
        />
        <span className="min-w-0">
          <span className="block font-display text-xl font-medium">{eventTitle(event.title)}</span>
          <span className="block text-sm text-muted tabular-nums">{formatWhen(event, day)}</span>
          {event.location ? <span className="block truncate text-sm">{event.location}</span> : null}
          {meta ? <span className="block text-xs text-faint tabular-nums">{meta}</span> : null}
        </span>
      </button>
    </li>
  );
}
