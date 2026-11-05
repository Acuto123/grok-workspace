import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-f8fDwjC8.mjs";
import { a as authMiddleware, d as isRepeatRule, t as COLOR_IDS } from "./present-C7KVW0aI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-8pa68eZ1.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function asRecord(input) {
	if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Nieprawidłowe dane");
	return input;
}
function readString(data, key, max) {
	const value = data[key];
	if (value == null || value === "") return "";
	if (typeof value !== "string") throw new Error("Nieprawidłowe dane");
	return value.trim().slice(0, max);
}
function readDate(data, key) {
	const value = readString(data, key, 10);
	if (!value) return "";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data jest niepoprawna");
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("Data jest niepoprawna");
	return value;
}
function readTime(data, key) {
	const value = readString(data, key, 8);
	if (!value) return "";
	const match = /^(\d{2}):(\d{2})/.exec(value);
	if (!match) throw new Error("Godzina jest niepoprawna");
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours > 23 || minutes > 59) throw new Error("Godzina jest niepoprawna");
	return `${match[1]}:${match[2]}`;
}
function cleanEvent(input) {
	const data = asRecord(input);
	const startDate = readDate(data, "startDate");
	const endDate = readDate(data, "endDate");
	if (startDate && endDate && endDate < startDate) throw new Error("Koniec jest wcześniejszy niż początek");
	if (startDate && endDate) {
		if ((Date.parse(endDate) - Date.parse(startDate)) / 864e5 > 366) throw new Error("Wydarzenie może trwać najwyżej rok");
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
		repeat
	};
}
function cleanId(input) {
	const id = typeof input === "string" ? input : readString(asRecord(input), "id", 36);
	if (!ID_RE.test(id)) throw new Error("Nie znaleziono wydarzenia");
	return id;
}
function emptyToNull(value) {
	return value ? value : null;
}
async function load(sql, userId) {
	await sql`insert into presence (user_id, last_seen) values (${userId}, now())
    on conflict (user_id) do update set last_seen = now()`;
	const events = await sql`
    select e.id, e.creator_id, u.name as creator_name, e.title, e.color,
      e.start_date, e.end_date, e.start_time, e.end_time, e.location,
      e.repeat_rule, e.created_at::text as created_at
    from events e
    left join "user" u on u.id = e.creator_id
    order by e.start_date asc nulls last, e.start_time asc nulls last, e.created_at asc
  `;
	const proposals = await sql`
    select p.id, p.event_id, p.user_id, u.name as user_name,
      p.start_date, p.end_date, p.start_time, p.end_time, p.note,
      p.created_at::text as created_at
    from time_proposals p
    left join "user" u on u.id = p.user_id
    order by p.created_at asc
  `;
	const votes = await sql`
    select v.proposal_id, v.user_id, u.name as user_name
    from proposal_votes v
    left join "user" u on u.id = v.user_id
    order by v.created_at asc
  `;
	const rsvps = await sql`
    select r.event_id, r.user_id, u.name as user_name, r.status
    from rsvps r
    left join "user" u on u.id = r.user_id
    order by r.updated_at asc
  `;
	const people = await sql`
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
			createdAt: row.created_at ?? ""
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
			createdAt: row.created_at ?? ""
		})),
		votes: votes.map((row) => ({
			proposalId: row.proposal_id,
			userId: row.user_id,
			userName: row.user_name || "Użytkownik"
		})),
		rsvps: rsvps.map((row) => ({
			eventId: row.event_id,
			userId: row.user_id,
			userName: row.user_name || "Użytkownik",
			status: row.status === "maybe" || row.status === "no" ? row.status : "yes"
		})),
		people: people.map((row) => ({
			id: row.id,
			name: row.name || "Użytkownik",
			image: row.image
		}))
	};
}
async function finish(sql, userId, focusId) {
	return {
		snapshot: await load(sql, userId),
		focusId
	};
}
var listCalendar_createServerFn_handler = createServerRpc({
	id: "726d8fd52d013193c4b7b47eae0d3bb23dc2f406b69a6867eca7e5cadde9400e",
	name: "listCalendar",
	filename: "src/lib/calendar/api.ts"
}, (opts) => listCalendar.__executeServer(opts));
var listCalendar = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCalendar_createServerFn_handler, async ({ context }) => {
	return load(await getSql(), context.userId);
});
var createEvent_createServerFn_handler = createServerRpc({
	id: "3f31968a7ac28be556269c3f2eba8c512db4df18fe88099d40c59cbdb3f9d27f",
	name: "createEvent",
	filename: "src/lib/calendar/api.ts"
}, (opts) => createEvent.__executeServer(opts));
var createEvent = createServerFn({ method: "POST" }).validator((input) => cleanEvent(input)).middleware([authMiddleware]).handler(createEvent_createServerFn_handler, async ({ context, data }) => {
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
var updateEvent_createServerFn_handler = createServerRpc({
	id: "9e1a8ede589a46d3065863aba4ed29fa5107735da2e9af1ed57c36464344480c",
	name: "updateEvent",
	filename: "src/lib/calendar/api.ts"
}, (opts) => updateEvent.__executeServer(opts));
var updateEvent = createServerFn({ method: "POST" }).validator((input) => {
	return {
		...cleanEvent(input),
		id: cleanId(asRecord(input).id)
	};
}).middleware([authMiddleware]).handler(updateEvent_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (!(await sql`
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
    `).length) throw new Error("Nie znaleziono wydarzenia");
	return finish(sql, context.userId, null);
});
var deleteEvent_createServerFn_handler = createServerRpc({
	id: "b73f8562b92e2c8d8eb6715fbb25d72d126d8185f0b8d2c1622038098fc7bf32",
	name: "deleteEvent",
	filename: "src/lib/calendar/api.ts"
}, (opts) => deleteEvent.__executeServer(opts));
var deleteEvent = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(deleteEvent_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	if (!(await sql`delete from events where id = ${id} returning id`).length) throw new Error("Nie znaleziono wydarzenia");
	return finish(sql, context.userId, null);
});
async function findSlot(sql, eventId, startDate, endDate, startTime, endTime) {
	return (await sql`
    select id from time_proposals
    where event_id = ${eventId}
      and start_date is not distinct from ${startDate}
      and end_date is not distinct from ${endDate}
      and start_time is not distinct from ${startTime}
      and end_time is not distinct from ${endTime}
    limit 1
  `)[0]?.id ?? null;
}
async function addVote(sql, proposalId, userId) {
	await sql`
    insert into proposal_votes (proposal_id, user_id)
    values (${proposalId}, ${userId})
    on conflict (proposal_id, user_id) do nothing
  `;
}
function isUniqueViolation(err) {
	if (!err || typeof err !== "object") return false;
	if ("code" in err && err.code === "23505") return true;
	if ("cause" in err) return isUniqueViolation(err.cause);
	return false;
}
var addProposal_createServerFn_handler = createServerRpc({
	id: "3e98f0b1dea4d7a6489b22a8a56b9002caafa86cacd96462e192776b55385cbb",
	name: "addProposal",
	filename: "src/lib/calendar/api.ts"
}, (opts) => addProposal.__executeServer(opts));
var addProposal = createServerFn({ method: "POST" }).validator((input) => {
	const data = asRecord(input);
	const eventId = cleanId(data.eventId);
	const startDate = readDate(data, "startDate");
	const endDate = readDate(data, "endDate");
	const startTime = readTime(data, "startTime");
	const endTime = readTime(data, "endTime");
	if (startDate && endDate && endDate < startDate) throw new Error("Koniec jest wcześniejszy niż początek");
	if (!startDate && !endDate && !startTime && !endTime) throw new Error("Podaj godzinę albo dzień propozycji");
	return {
		eventId,
		startDate,
		endDate,
		startTime,
		endTime,
		note: readString(data, "note", 280)
	};
}).middleware([authMiddleware]).handler(addProposal_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (!(await sql`select id from events where id = ${data.eventId}`).length) throw new Error("Nie znaleziono wydarzenia");
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
var voteProposal_createServerFn_handler = createServerRpc({
	id: "e140b5c95246b1b9cb5ded95ada99d8e00b1fed5b3af2e2b8b7219f5fafc3297",
	name: "voteProposal",
	filename: "src/lib/calendar/api.ts"
}, (opts) => voteProposal.__executeServer(opts));
var voteProposal = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(voteProposal_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	if (!(await sql`select id from time_proposals where id = ${id}`).length) throw new Error("Nie znaleziono propozycji");
	if ((await sql`
      select user_id from proposal_votes
      where proposal_id = ${id} and user_id = ${context.userId}
    `).length) await sql`
        delete from proposal_votes
        where proposal_id = ${id} and user_id = ${context.userId}
      `;
	else await addVote(sql, id, context.userId);
	return finish(sql, context.userId, null);
});
var deleteProposal_createServerFn_handler = createServerRpc({
	id: "35f689aa4e0818ec1d8485903840b268e8f8e83d55becb92c4d7042c74493faa",
	name: "deleteProposal",
	filename: "src/lib/calendar/api.ts"
}, (opts) => deleteProposal.__executeServer(opts));
var deleteProposal = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(deleteProposal_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	if (!(await sql`
      delete from time_proposals where id = ${id} and user_id = ${context.userId} returning id
    `).length) throw new Error("Możesz usunąć tylko własną propozycję");
	return finish(sql, context.userId, null);
});
var applyProposal_createServerFn_handler = createServerRpc({
	id: "8258a20d4f4b9f54ca80ebf878bebf951a61cdaf80e6aa46be79b4c4c07ea3a7",
	name: "applyProposal",
	filename: "src/lib/calendar/api.ts"
}, (opts) => applyProposal.__executeServer(opts));
var applyProposal = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(applyProposal_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	const proposal = (await sql`
      select event_id, start_date, end_date, start_time, end_time
      from time_proposals where id = ${id}
    `)[0];
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
var setRsvp_createServerFn_handler = createServerRpc({
	id: "5148ad17e26b311e36f7d46a4810b452fdc6c1af0921867282cd475b7aa5d4c5",
	name: "setRsvp",
	filename: "src/lib/calendar/api.ts"
}, (opts) => setRsvp.__executeServer(opts));
var setRsvp = createServerFn({ method: "POST" }).validator((input) => {
	const data = asRecord(input);
	const eventId = cleanId(data.eventId);
	const status = data.status;
	if (status !== "yes" && status !== "maybe" && status !== "no" && status !== "clear") throw new Error("Nieprawidłowa obecność");
	return {
		eventId,
		status
	};
}).middleware([authMiddleware]).handler(setRsvp_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (!(await sql`select id from events where id = ${data.eventId}`).length) throw new Error("Nie znaleziono wydarzenia");
	if (data.status === "clear") await sql`delete from rsvps where event_id = ${data.eventId} and user_id = ${context.userId}`;
	else await sql`
        insert into rsvps (event_id, user_id, status)
        values (${data.eventId}, ${context.userId}, ${data.status})
        on conflict (event_id, user_id)
        do update set status = ${data.status}, updated_at = now()
      `;
	return finish(sql, context.userId, null);
});
//#endregion
export { addProposal_createServerFn_handler, applyProposal_createServerFn_handler, createEvent_createServerFn_handler, deleteEvent_createServerFn_handler, deleteProposal_createServerFn_handler, listCalendar_createServerFn_handler, setRsvp_createServerFn_handler, updateEvent_createServerFn_handler, voteProposal_createServerFn_handler };
