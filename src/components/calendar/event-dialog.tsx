import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Ban, Clock, MapPin, Trash2, X } from "lucide-react";
import {
  addProposal,
  applyProposal,
  createEvent,
  deleteEvent,
  deleteProposal,
  setRsvp,
  updateEvent,
  voteProposal,
  type EventInput,
  type EventRow,
  type MutationResult,
  type ProposalRow,
  type RsvpRow,
  type RsvpStatus,
  type VoteRow,
} from "@/lib/calendar/api";
import {
  EVENT_COLORS,
  eventColor,
  REPEAT_OPTIONS,
  errorText,
  eventTitle,
  formatWhen,
  isRepeatRule,
  plCount,
  sameSlot,
} from "@/lib/calendar/present";
import { btnInk, btnLine, btnQuiet, fieldClass } from "@/components/controls";
import { twMerge } from "tailwind-merge";

type Mode = "create" | "event";

function blankEvent(day: string | null): EventInput {
  return {
    title: "",
    color: "",
    startDate: day ?? "",
    endDate: day ?? "",
    startTime: "",
    endTime: "",
    location: "",
    repeat: "none",
  };
}

function toForm(event: EventRow): EventInput {
  return {
    title: event.title,
    color: event.color,
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    location: event.location,
    repeat: event.repeat || "none",
  };
}

export function EventDialog({
  mode,
  event,
  proposals,
  votes,
  rsvps,
  me,
  initialDay,
  onClose,
  onResult,
}: {
  mode: Mode;
  event: EventRow | null;
  proposals: ProposalRow[];
  votes: VoteRow[];
  rsvps: RsvpRow[];
  me: string;
  initialDay: string | null;
  onClose: () => void;
  onResult: (result: MutationResult, close: boolean) => void;
}) {
  const [editing, setEditing] = useState(mode === "create");
  const [form, setForm] = useState<EventInput>(() =>
    mode === "create" || !event ? blankEvent(initialDay) : toForm(event),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [proposal, setProposal] = useState({
    startDate: event?.startDate ?? initialDay ?? "",
    startTime: "",
    endTime: "",
    note: "",
  });
  const [pickedId, setPickedId] = useState<string | null>(null);

  const mine = rsvps.find((row) => row.userId === me)?.status ?? null;
  const picked = proposals.find((item) => item.id === pickedId) ?? null;
  const draftSlot = {
    startDate: proposal.startDate,
    endDate: proposal.startDate,
    startTime: proposal.startTime,
    endTime: proposal.endTime,
  };
  const matched = proposals.find((item) => sameSlot(item, draftSlot)) ?? null;
  const matchedVoted = matched
    ? votes.some((vote) => vote.proposalId === matched.id && vote.userId === me)
    : false;
  const showDock = !editing && Boolean(event) && proposals.length > 0;
  const ranked = [...proposals].sort((a, b) => {
    const count = (id: string) => votes.filter((vote) => vote.proposalId === id).length;
    const diff = count(b.id) - count(a.id);
    if (diff !== 0) return diff;
    return a.createdAt.localeCompare(b.createdAt);
  });
  const pickedMine = picked
    ? votes.some((vote) => vote.proposalId === picked.id && vote.userId === me)
    : false;

  function patch(partial: Partial<EventInput>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function run(action: () => Promise<MutationResult>, close: boolean): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      onResult(result, close);
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setPending(false);
    }
  }

  async function saveEvent(submit: FormEvent) {
    submit.preventDefault();
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("Koniec jest wcześniejszy niż początek");
      return;
    }
    if (mode === "create") {
      await run(() => createEvent({ data: form }), false);
      return;
    }
    if (!event) return;
    const ok = await run(() => updateEvent({ data: { ...form, id: event.id } }), false);
    if (ok) setEditing(false);
  }

  const names = (status: RsvpStatus) =>
    rsvps
      .filter((row) => row.status === status)
      .map((row) => (row.userId === me ? "Ty" : row.userName));

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-backdrop fade-in" />
        <Dialog.Content
          className={`sheet sheet-dock fade-in text-ink${showDock ? " sheet-tall" : ""}`}
          aria-describedby="event-help"
        >
          <div className="sheet-scroll">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="font-display text-2xl font-medium">
              {mode === "create"
                ? "Nowe wydarzenie"
                : editing
                  ? "Edycja wydarzenia"
                  : eventTitle(event?.title ?? "")}
            </Dialog.Title>
            <Dialog.Close className={btnQuiet} aria-label="Zamknij">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description id="event-help" className="mt-1 text-sm text-muted">
            Nic nie jest wymagane. Puste pola można uzupełnić później.
          </Dialog.Description>

          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {editing ? (
            <form className="mt-4 grid gap-4" onSubmit={saveEvent}>
              <label className="grid gap-1 text-sm font-medium">
                Nazwa
                <input
                  id="event-title"
                  className={fieldClass}
                  value={form.title}
                  onChange={(input) => patch({ title: input.target.value })}
                  placeholder="np. Siłka"
                  maxLength={120}
                  autoComplete="off"
                />
              </label>

              <fieldset>
                <legend className="text-sm font-medium">Kolor</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EVENT_COLORS.map((swatch) => {
                    const selected = eventColor(form.color) === swatch.id;
                    return (
                      <button
                        key={swatch.id || "none"}
                        type="button"
                        aria-label={swatch.label}
                        aria-pressed={selected}
                        className={`grid size-11 place-items-center rounded-full border ${
                          selected ? "border-ink ring-2 ring-ink" : "border-line"
                        }`}
                        style={{ background: swatch.id || "transparent" }}
                        onClick={() => patch({ color: swatch.id })}
                      >
                        {swatch.id ? null : <Ban className="size-4 text-faint" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium">Dni</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm text-muted">
                    Od
                    <input
                      id="event-start-date"
                      className={fieldClass}
                      type="date"
                      value={form.startDate}
                      onChange={(input) => patch({ startDate: input.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-muted">
                    Do
                    <input
                      id="event-end-date"
                      className={fieldClass}
                      type="date"
                      value={form.endDate}
                      onChange={(input) => patch({ endDate: input.target.value })}
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium">Godziny</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm text-muted">
                    Od
                    <input
                      id="event-start-time"
                      className={fieldClass}
                      type="time"
                      value={form.startTime}
                      onChange={(input) => patch({ startTime: input.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-muted">
                    Do
                    <input
                      id="event-end-time"
                      className={fieldClass}
                      type="time"
                      value={form.endTime}
                      onChange={(input) => patch({ endTime: input.target.value })}
                    />
                  </label>
                </div>
              </fieldset>

              <label className="grid gap-1 text-sm font-medium">
                Powtarzanie
                <select
                  id="event-repeat"
                  className={fieldClass}
                  value={form.repeat}
                  onChange={(input) => {
                    if (isRepeatRule(input.target.value)) patch({ repeat: input.target.value });
                  }}
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium">
                Miejsce
                <input
                  id="event-location"
                  className={fieldClass}
                  value={form.location}
                  onChange={(input) => patch({ location: input.target.value })}
                  placeholder="np. siłownia na Grunwaldzkiej"
                  maxLength={200}
                  autoComplete="off"
                />
              </label>

              {form.startDate || form.endDate || form.startTime || form.endTime ? (
                <button
                  type="button"
                  className={`${btnQuiet} justify-start px-0`}
                  onClick={() =>
                    patch({ startDate: "", endDate: "", startTime: "", endTime: "" })
                  }
                >
                  Wyczyść termin
                </button>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button id="save-event" className={btnInk} type="submit" disabled={pending}>
                  {pending ? "Zapisywanie…" : mode === "create" ? "Dodaj wydarzenie" : "Zapisz zmiany"}
                </button>
                {mode === "event" ? (
                  <button
                    type="button"
                    className={btnLine}
                    onClick={() => {
                      if (event) setForm(toForm(event));
                      setEditing(false);
                      setError(null);
                    }}
                  >
                    Anuluj
                  </button>
                ) : null}
              </div>
            </form>
          ) : event ? (
            <div className="mt-4 grid gap-5">
              <div className="flex gap-3">
                <span
                  className="mt-1 h-12 w-1.5 shrink-0 rounded-full"
                  style={{ background: eventColor(event.color) || "var(--color-line-strong)" }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-muted tabular-nums">{formatWhen(event)}</p>
                  {event.location ? (
                    <p className="mt-1 flex items-center gap-1 text-sm">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      <span className="break-words">{event.location}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-faint">Bez miejsca</p>
                  )}
                  <p className="mt-1 text-sm text-faint">Od {event.creatorName}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Kto przychodzi</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(
                    [
                      ["yes", "Przyjdę"],
                      ["maybe", "Może"],
                      ["no", "Nie przyjdę"],
                    ] as const
                  ).map(([status, label]) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={mine === status}
                      disabled={pending}
                      className={twMerge(mine === status ? btnInk : btnLine, "h-auto min-h-11 w-full px-1 text-center")}
                      onClick={() =>
                        void run(
                          () =>
                            setRsvp({
                              data: {
                                eventId: event.id,
                                status: mine === status ? "clear" : status,
                              },
                            }),
                          false,
                        )
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 grid gap-1 text-sm text-muted">
                  {names("yes").length > 0 ? <p>Przyjdą: {names("yes").join(", ")}</p> : null}
                  {names("maybe").length > 0 ? <p>Może: {names("maybe").join(", ")}</p> : null}
                  {names("no").length > 0 ? <p>Nie przyjdą: {names("no").join(", ")}</p> : null}
                  {rsvps.length === 0 ? <p>Nikt jeszcze nie zaznaczył obecności.</p> : null}
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="size-4" aria-hidden="true" />
                  Propozycje godzin
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Kliknij godzinę, a na dole naciśnij Zagłosuj. Ta sama godzina nie dubluje się.
                </p>
                {ranked.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">
                    Nikt jeszcze nie podał godziny. Dopisz swoją — reszta grupy zagłosuje na nią.
                  </p>
                ) : (
                  <ul className="mt-2 grid gap-2">
                    {ranked.map((item) => {
                      const itemVotes = votes.filter((vote) => vote.proposalId === item.id);
                      const voted = itemVotes.some((vote) => vote.userId === me);
                      const selected = picked?.id === item.id;
                      const who = itemVotes
                        .map((vote) => (vote.userId === me ? "Ty" : vote.userName))
                        .join(", ");
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-pressed={selected}
                            className={twMerge(
                              "w-full rounded-sm border px-3 py-3 text-left",
                              selected ? "border-ink bg-paper" : "border-line bg-paper",
                            )}
                            onClick={() => setPickedId(item.id)}
                          >
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="text-sm font-semibold tabular-nums">{formatWhen(item)}</span>
                              <span className="shrink-0 text-xs text-muted">
                                {plCount(itemVotes.length, "głos", "głosy", "głosów")}
                              </span>
                            </span>
                            <span className="mt-1 block text-sm text-muted">
                              {item.userId === me ? "Ty" : item.userName}
                              {voted ? " · Twój głos" : ""}
                            </span>
                            {who ? <span className="mt-1 block text-sm">{who}</span> : null}
                            {item.note ? (
                              <span className="mt-1 block font-display text-base text-muted">{item.note}</span>
                            ) : null}
                          </button>
                          <div className="mt-1 flex flex-wrap">
                            <button
                              type="button"
                              className={btnQuiet}
                              disabled={pending}
                              onClick={() => void run(() => applyProposal({ data: item.id }), false)}
                            >
                              Ustaw jako termin
                            </button>
                            {item.userId === me ? (
                              <button
                                type="button"
                                className={btnQuiet}
                                disabled={pending}
                                onClick={() => {
                                  if (pickedId === item.id) setPickedId(null);
                                  void run(() => deleteProposal({ data: item.id }), false);
                                }}
                              >
                                Usuń
                              </button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <form
                  className="mt-3 grid gap-2"
                  onSubmit={(submit) => {
                    submit.preventDefault();
                    if (matched) setPickedId(matched.id);
                    if (matchedVoted) return;
                    void run(
                      () =>
                        addProposal({
                          data: {
                            eventId: event.id,
                            startDate: proposal.startDate,
                            endDate: proposal.startDate,
                            startTime: proposal.startTime,
                            endTime: proposal.endTime,
                            note: proposal.note,
                          },
                        }),
                      false,
                    ).then((ok) => {
                      if (!ok) return;
                      setProposal({
                        startDate: event.startDate ?? "",
                        startTime: "",
                        endTime: "",
                        note: "",
                      });
                    });
                  }}
                >
                  <p className="text-sm font-medium">
                    {matched ? "Ta godzina już jest" : "Nowa godzina"}
                  </p>
                  {matched ? (
                    <p className="text-sm text-muted">
                      Nie dodajemy drugiej takiej samej. Zagłosuj na istniejącą.
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      id="proposal-date"
                      aria-label="Dzień propozycji"
                      className={fieldClass}
                      type="date"
                      value={proposal.startDate}
                      onChange={(input) =>
                        setProposal((current) => ({ ...current, startDate: input.target.value }))
                      }
                    />
                    <input
                      id="proposal-start"
                      aria-label="Godzina od"
                      className={fieldClass}
                      type="time"
                      value={proposal.startTime}
                      onChange={(input) =>
                        setProposal((current) => ({ ...current, startTime: input.target.value }))
                      }
                    />
                    <input
                      id="proposal-end"
                      aria-label="Godzina do"
                      className={fieldClass}
                      type="time"
                      value={proposal.endTime}
                      onChange={(input) =>
                        setProposal((current) => ({ ...current, endTime: input.target.value }))
                      }
                    />
                  </div>
                  {matched ? null : (
                    <input
                      id="proposal-note"
                      className={fieldClass}
                      value={proposal.note}
                      onChange={(input) =>
                        setProposal((current) => ({ ...current, note: input.target.value }))
                      }
                      placeholder="Notatka, np. po pracy"
                      maxLength={280}
                    />
                  )}
                  <button
                    id="add-proposal"
                    className={btnLine}
                    type="submit"
                    disabled={pending || matchedVoted}
                  >
                    {matchedVoted
                      ? "Już zagłosowane"
                      : matched
                        ? "Zagłosuj na tę godzinę"
                        : "Zaproponuj godzinę"}
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  className={btnLine}
                  onClick={() => {
                    setForm(toForm(event));
                    setEditing(true);
                    setError(null);
                  }}
                >
                  Edytuj
                </button>
                {confirmDelete ? (
                  <button
                    type="button"
                    className={twMerge(btnInk, "bg-danger")}
                    disabled={pending}
                    onClick={() => void run(() => deleteEvent({ data: event.id }), true)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Potwierdź usunięcie
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${btnQuiet} text-danger`}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Usuń
                  </button>
                )}
              </div>
            </div>
          ) : null}
          </div>
          {showDock ? (
            <div className="sheet-dockbar">
              <button
                id="vote-proposal"
                type="button"
                className={`${btnInk} w-full`}
                disabled={!picked || pending}
                onClick={() => {
                  if (!picked) return;
                  void run(() => voteProposal({ data: picked.id }), false);
                }}
              >
                {pickedMine ? "Cofnij głos" : "Zagłosuj"}
              </button>
              <p className="mt-1 text-center text-xs text-muted">
                {picked ? formatWhen(picked) : "Wybierz propozycję powyżej"}
              </p>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
