import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { COLOR_IDS, isRepeatRule, type RepeatRule } from "@/lib/calendar/present";

export type EventInput = {
  title: string;
  color: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  repeat: RepeatRule;
};

export type EventRow = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  color: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  repeat: RepeatRule;
  createdAt: string;
};

export type ProposalRow = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  note: string;
  createdAt: string;
};

export type RsvpStatus = "yes" | "maybe" | "no";

export type RsvpRow = {
  eventId: string;
  userId: string;
  userName: string;
  status: RsvpStatus;
};

export type PersonRow = {
  id: string;
  name: string;
  image: string | null;
};

export type VoteRow = {
  proposalId: string;
  userId: string;
  userName: string;
};

export type CalendarSnapshot = {
  events: EventRow[];
  proposals: ProposalRow[];
  votes: VoteRow[];
  rsvps: RsvpRow[];
  people: PersonRow[];
};

export type MutationResult = {
  snapshot: CalendarSnapshot;
  focusId: string | null;
};

export const calendarQueryKey = ["calendar"] as const;

const ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Nieprawidłowe dane");
  }
  return input as Record<string, unknown>;
}

function readString(data: Record<string, unknown>, key: string, max: number): string {
  const value = data[key];
  if (value == null || value === "") return "";
  if (typeof value !== "string") throw new Error("Nieprawidłowe dane");
  return value.trim().slice(0, max);
}

function readDate(data: Record<string, unknown>, key: string): string {
  const value = readString(data, key, 10);
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data jest niepoprawna");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Data jest niepoprawna");
  }
  return value;
}

function readTime(data: Record<string, unknown>, key: string): string {
  const value = readString(data, key, 8);
  if (!value) return "";
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) throw new Error("Godzina jest niepoprawna");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("Godzina jest niepoprawna");
  return `${match[1]}:${match[2]}`;
}

function cleanEvent(input: unknown): EventInput {
  const data = asRecord(input);
  const startDate = readDate(data, "startDate");
  const endDate = readDate(data, "endDate");
  if (startDate && endDate && endDate < startDate) {
    throw new Error("Koniec jest wcześniejszy niż początek");
  }
  if (startDate && endDate) {
    const span = (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000;
    if (span > 366) throw new Error("Wydarzenie może trwać najwyżej rok");
  }
  const color = readString(data, "color", 7).toLowerCase();
  if (!COLOR_IDS.has(color)) throw new Error("Kolor jest niepoprawny");
  const repeat = readString(data, "repeat", 16) || "none";
  if (!isRepeatRule(repeat)) throw new Error("Powtarzanie jest niepoprawne");
  return {
    title: readString(data, "title", 120),
    color,
    startDate,
    endDate,
    startTime: readTime(data, "startTime"),
    endTime: readTime(data, "endTime"),
    location: readString(data, "location", 200),
    repeat,
  };
}

function cleanId(input: unknown): string {
  const id = typeof input === "string" ? input : readString(asRecord(input), "id", 36);
  if (!ID_RE.test(id)) throw new Error("Nie znaleziono wydarzenia");
  return id;
}

function emptyToNull(value: string): string | null {
  return value ? value : null;
}

type RawEvent = {
  id: string;
  creator_id: string;
  creator_name: string | null;
  title: string | null;
  color: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  repeat_rule: string | null;
  created_at: string | null;
};

type RawProposal = {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  created_at: string | null;
};

type RawVote = {
  proposal_id: string;
  user_id: string;
  user_name: string | null;
};

type RawRsvp = {
  event_id: string;
  user_id: string;
  user_name: string | null;
  status: string;
};

async function load(sql: Sql, userId: string): Promise<CalendarSnapshot> {
  await sql`insert into presence (user_id, last_seen) values (${userId}, now())
    on conflict (user_id) do update set last_seen = now()`;

  const events = await sql<RawEvent>`
    select e.id, e.creator_id, u.name as creator_name, e.title, e.color,
      e.start_date, e.end_date, e.start_time, e.end_time, e.location,
      e.repeat_rule, e.created_at::text as created_at
    from events e
    left join "user" u on u.id = e.creator_id
    order by e.start_date asc nulls last, e.start_time asc nulls last, e.created_at asc
  `;

  const proposals = await sql<RawProposal>`
    select p.id, p.event_id, p.user_id, u.name as user_name,
      p.start_date, p.end_date, p.start_time, p.end_time, p.note,
      p.created_at::text as created_at
    from time_proposals p
    left join "user" u on u.id = p.user_id
    order by p.created_at asc
  `;

  const votes = await sql<RawVote>`
    select v.proposal_id, v.user_id, u.name as user_name
    from proposal_votes v
    left join "user" u on u.id = v.user_id
    order by v.created_at asc
  `;

  const rsvps = await sql<RawRsvp>`
    select r.event_id, r.user_id, u.name as user_name, r.status
    from rsvps r
    left join "user" u on u.id = r.user_id
    order by r.updated_at asc
  `;

  const people = await sql<{ id: string; name: string | null; image: string | null }>`
    select u.id, u.name, u.image
    from presence p
    join "user" u on u.id = p.user_id
    where p.last_seen > now() - interval '40 seconds'
    order by u.name asc
  `;

  return {
    events: events.map((row) => ({
      id: row.id,
      creatorId: row.creator_id,
      creatorName: row.creator_name || "Użytkownik",
      title: row.title ?? "",
      color: row.color ?? "",
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location ?? "",
      repeat: row.repeat_rule && isRepeatRule(row.repeat_rule) ? row.repeat_rule : "none",
      createdAt: row.created_at ?? "",
    })),
    proposals: proposals.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      userName: row.user_name || "Użytkownik",
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: row.start_time,
      endTime: row.end_time,
      note: row.note ?? "",
      createdAt: row.created_at ?? "",
    })),
    votes: votes.map((row) => ({
      proposalId: row.proposal_id,
      userId: row.user_id,
      userName: row.user_name || "Użytkownik",
    })),
    rsvps: rsvps.map((row) => ({
      eventId: row.event_id,
      userId: row.user_id,
      userName: row.user_name || "Użytkownik",
      status: row.status === "maybe" || row.status === "no" ? row.status : "yes",
    })),
    people: people.map((row) => ({
      id: row.id,
      name: row.name || "Użytkownik",
      image: row.image,
    })),
  };
}

async function finish(sql: Sql, userId: string, focusId: string | null): Promise<MutationResult> {
  return { snapshot: await load(sql, userId), focusId };
}

export const listCalendar = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return load(sql, context.userId);
  });

export const createEvent = createServerFn({ method: "POST" })
  .validator((input: EventInput) => cleanEvent(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into events (
        id, creator_id, title, color, start_date, end_date, start_time, end_time, location, repeat_rule
      ) values (
        ${id}, ${context.userId}, ${data.title}, ${data.color},
        ${emptyToNull(data.startDate)}, ${emptyToNull(data.endDate)},
        ${emptyToNull(data.startTime)}, ${emptyToNull(data.endTime)}, ${data.location},
        ${data.repeat}
      )
    `;
    return finish(sql, context.userId, id);
  });

export const updateEvent = createServerFn({ method: "POST" })
  .validator((input: EventInput & { id: string }) => {
    const data = cleanEvent(input);
    return { ...data, id: cleanId(asRecord(input).id) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`
      update events set
        title = ${data.title},
        color = ${data.color},
        start_date = ${emptyToNull(data.startDate)},
        end_date = ${emptyToNull(data.endDate)},
        start_time = ${emptyToNull(data.startTime)},
        end_time = ${emptyToNull(data.endTime)},
        location = ${data.location},
        repeat_rule = ${data.repeat},
        updated_at = now()
      where id = ${data.id}
      returning id
    `;
    if (!rows.length) throw new Error("Nie znaleziono wydarzenia");
    return finish(sql, context.userId, null);
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((id: string) => cleanId(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`delete from events where id = ${id} returning id`;
    if (!rows.length) throw new Error("Nie znaleziono wydarzenia");
    return finish(sql, context.userId, null);
  });

async function findSlot(
  sql: Sql,
  eventId: string,
  startDate: string | null,
  endDate: string | null,
  startTime: string | null,
  endTime: string | null,
): Promise<string | null> {
  const rows = await sql<{ id: string }>`
    select id from time_proposals
    where event_id = ${eventId}
      and start_date is not distinct from ${startDate}
      and end_date is not distinct from ${endDate}
      and start_time is not distinct from ${startTime}
      and end_time is not distinct from ${endTime}
    limit 1
  `;
  return rows[0]?.id ?? null;
}

async function addVote(sql: Sql, proposalId: string, userId: string) {
  await sql`
    insert into proposal_votes (proposal_id, user_id)
    values (${proposalId}, ${userId})
    on conflict (proposal_id, user_id) do nothing
  `;
}

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if ("code" in err && (err as { code?: string }).code === "23505") return true;
  if ("cause" in err) return isUniqueViolation((err as { cause?: unknown }).cause);
  return false;
}

export const addProposal = createServerFn({ method: "POST" })
  .validator((input: {
    eventId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    note: string;
  }) => {
    const data = asRecord(input);
    const eventId = cleanId(data.eventId);
    const startDate = readDate(data, "startDate");
    const endDate = readDate(data, "endDate");
    const startTime = readTime(data, "startTime");
    const endTime = readTime(data, "endTime");
    if (startDate && endDate && endDate < startDate) {
      throw new Error("Koniec jest wcześniejszy niż początek");
    }
    if (!startDate && !endDate && !startTime && !endTime) {
      throw new Error("Podaj godzinę albo dzień propozycji");
    }
    return {
      eventId,
      startDate,
      endDate,
      startTime,
      endTime,
      note: readString(data, "note", 280),
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const found = await sql<{ id: string }>`select id from events where id = ${data.eventId}`;
    if (!found.length) throw new Error("Nie znaleziono wydarzenia");
    const startDate = emptyToNull(data.startDate);
    const endDate = emptyToNull(data.endDate);
    const startTime = emptyToNull(data.startTime);
    const endTime = emptyToNull(data.endTime);
    const existing = await findSlot(sql, data.eventId, startDate, endDate, startTime, endTime);
    if (existing) {
      await addVote(sql, existing, context.userId);
      return finish(sql, context.userId, null);
    }
    const id = crypto.randomUUID();
    try {
      await sql`
        insert into time_proposals (
          id, event_id, user_id, start_date, end_date, start_time, end_time, note
        ) values (
          ${id}, ${data.eventId}, ${context.userId},
          ${startDate}, ${endDate}, ${startTime}, ${endTime}, ${data.note}
        )
      `;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const raced = await findSlot(sql, data.eventId, startDate, endDate, startTime, endTime);
      if (!raced) throw err;
      await addVote(sql, raced, context.userId);
      return finish(sql, context.userId, null);
    }
    await addVote(sql, id, context.userId);
    return finish(sql, context.userId, null);
  });

export const voteProposal = createServerFn({ method: "POST" })
  .validator((id: string) => cleanId(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const found = await sql<{ id: string }>`select id from time_proposals where id = ${id}`;
    if (!found.length) throw new Error("Nie znaleziono propozycji");
    const mine = await sql<{ user_id: string }>`
      select user_id from proposal_votes
      where proposal_id = ${id} and user_id = ${context.userId}
    `;
    if (mine.length) {
      await sql`
        delete from proposal_votes
        where proposal_id = ${id} and user_id = ${context.userId}
      `;
    } else {
      await addVote(sql, id, context.userId);
    }
    return finish(sql, context.userId, null);
  });

export const deleteProposal = createServerFn({ method: "POST" })
  .validator((id: string) => cleanId(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`
      delete from time_proposals where id = ${id} and user_id = ${context.userId} returning id
    `;
    if (!rows.length) throw new Error("Możesz usunąć tylko własną propozycję");
    return finish(sql, context.userId, null);
  });

export const applyProposal = createServerFn({ method: "POST" })
  .validator((id: string) => cleanId(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<{
      event_id: string;
      start_date: string | null;
      end_date: string | null;
      start_time: string | null;
      end_time: string | null;
    }>`
      select event_id, start_date, end_date, start_time, end_time
      from time_proposals where id = ${id}
    `;
    const proposal = rows[0];
    if (!proposal) throw new Error("Nie znaleziono propozycji");
    await sql`
      update events set
        start_date = coalesce(${proposal.start_date}, start_date),
        end_date = coalesce(${proposal.end_date}, ${proposal.start_date}, end_date),
        start_time = coalesce(${proposal.start_time}, start_time),
        end_time = coalesce(${proposal.end_time}, end_time),
        updated_at = now()
      where id = ${proposal.event_id}
    `;
    return finish(sql, context.userId, null);
  });

export const setRsvp = createServerFn({ method: "POST" })
  .validator((input: { eventId: string; status: RsvpStatus | "clear" }) => {
    const data = asRecord(input);
    const eventId = cleanId(data.eventId);
    const status = data.status;
    if (status !== "yes" && status !== "maybe" && status !== "no" && status !== "clear") {
      throw new Error("Nieprawidłowa obecność");
    }
    return { eventId, status };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const found = await sql<{ id: string }>`select id from events where id = ${data.eventId}`;
    if (!found.length) throw new Error("Nie znaleziono wydarzenia");
    if (data.status === "clear") {
      await sql`delete from rsvps where event_id = ${data.eventId} and user_id = ${context.userId}`;
    } else {
      await sql`
        insert into rsvps (event_id, user_id, status)
        values (${data.eventId}, ${context.userId}, ${data.status})
        on conflict (event_id, user_id)
        do update set status = ${data.status}, updated_at = now()
      `;
    }
    return finish(sql, context.userId, null);
  });
