import { n as createMiddleware } from "./ssr.mjs";
import { a as startOfMonth, c as addYears, d as addMonths, f as addDays, i as endOfWeek, l as differenceInCalendarDays, n as parseISO, o as eachDayOfInterval, r as format, s as endOfMonth, t as pl, u as startOfWeek } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/present-C7KVW0aI.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-CoMeym3u.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-BIb-FW2y.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
var REPEAT_RULES = [
	"none",
	"daily",
	"weekly",
	"biweekly",
	"monthly",
	"yearly"
];
var REPEAT_OPTIONS = [
	{
		id: "none",
		label: "Nie powtarza się"
	},
	{
		id: "daily",
		label: "Codziennie"
	},
	{
		id: "weekly",
		label: "Co tydzień"
	},
	{
		id: "biweekly",
		label: "Co 2 tygodnie"
	},
	{
		id: "monthly",
		label: "Co miesiąc"
	},
	{
		id: "yearly",
		label: "Co rok"
	}
];
function isRepeatRule(value) {
	return REPEAT_RULES.includes(value);
}
function repeatLabel(rule) {
	return REPEAT_OPTIONS.find((item) => item.id === rule)?.label ?? REPEAT_OPTIONS[0].label;
}
var EVENT_COLORS = [
	{
		id: "",
		label: "Bez koloru"
	},
	{
		id: "#1c1917",
		label: "Atrament"
	},
	{
		id: "#2c4a3e",
		label: "Zieleń"
	},
	{
		id: "#8c4a3a",
		label: "Glina"
	},
	{
		id: "#3d5a73",
		label: "Stal"
	},
	{
		id: "#6b5344",
		label: "Umbra"
	},
	{
		id: "#3e5c5a",
		label: "Morska"
	}
];
var COLOR_IDS = new Set(EVENT_COLORS.map((c) => c.id));
var WEEKDAYS = [
	"Pn",
	"Wt",
	"Śr",
	"Cz",
	"Pt",
	"So",
	"Nd"
];
function todayIso(now = /* @__PURE__ */ new Date()) {
	return format(now, "yyyy-MM-dd");
}
function monthCursor(now = /* @__PURE__ */ new Date()) {
	return format(startOfMonth(now), "yyyy-MM-dd");
}
function shiftMonth(cursor, delta) {
	return format(addMonths(parseISO(cursor), delta), "yyyy-MM-dd");
}
function monthTitle(cursor) {
	const label = format(parseISO(cursor), "LLLL yyyy", { locale: pl });
	return label.charAt(0).toUpperCase() + label.slice(1);
}
function dayTitle(iso) {
	const label = format(parseISO(iso), "EEEE, d MMMM", { locale: pl });
	return label.charAt(0).toUpperCase() + label.slice(1);
}
function monthCells(cursor) {
	const start = startOfWeek(startOfMonth(parseISO(cursor)), { weekStartsOn: 1 });
	const end = endOfWeek(endOfMonth(parseISO(cursor)), { weekStartsOn: 1 });
	const days = eachDayOfInterval({
		start,
		end
	});
	while (days.length < 42) {
		const tail = days[days.length - 1];
		days.push(new Date(tail.getFullYear(), tail.getMonth(), tail.getDate() + 1));
	}
	return days.slice(0, 42).map((d) => format(d, "yyyy-MM-dd"));
}
function sameMonth(iso, cursor) {
	return iso.slice(0, 7) === cursor.slice(0, 7);
}
function ruleOf(event) {
	const value = event.repeat ?? "none";
	return isRepeatRule(value) ? value : "none";
}
function anchorOf(event) {
	return event.startDate || event.endDate || null;
}
function spanDays(event) {
	const anchor = anchorOf(event);
	if (!anchor) return 0;
	const end = event.endDate && event.endDate >= anchor ? event.endDate : anchor;
	const span = differenceInCalendarDays(parseISO(end), parseISO(anchor));
	return span < 0 ? 0 : Math.min(span, 366);
}
function isOccurrenceStart(anchorIso, candidateIso, rule) {
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
		const months = (candidate.getFullYear() - anchor.getFullYear()) * 12 + (candidate.getMonth() - anchor.getMonth());
		if (months < 0) return false;
		return format(addMonths(anchor, months), "yyyy-MM-dd") === candidateIso;
	}
	const years = candidate.getFullYear() - anchor.getFullYear();
	if (years < 0) return false;
	return format(addYears(anchor, years), "yyyy-MM-dd") === candidateIso;
}
function coversDay(event, iso) {
	return occurrenceOn(event, iso) !== null;
}
function occurrenceOn(event, iso) {
	const anchor = anchorOf(event);
	if (!anchor) return null;
	const rule = ruleOf(event);
	const span = spanDays(event);
	if (rule === "none") {
		const end = event.endDate && event.endDate >= anchor ? event.endDate : anchor;
		if (iso < anchor || iso > end) return null;
		return {
			start: anchor,
			end
		};
	}
	const day = parseISO(iso);
	for (let back = 0; back <= span; back += 1) {
		const startIso = format(addDays(day, -back), "yyyy-MM-dd");
		if (startIso < anchor) continue;
		if (isOccurrenceStart(anchor, startIso, rule)) return {
			start: startIso,
			end: format(addDays(parseISO(startIso), span), "yyyy-MM-dd")
		};
	}
	return null;
}
function sameSlot(proposal, draft) {
	const start = proposal.startDate ?? "";
	const end = proposal.endDate ?? "";
	const draftEnd = draft.endDate || draft.startDate;
	return start === draft.startDate && (end || start) === (draftEnd || draft.startDate) && (proposal.startTime ?? "") === draft.startTime && (proposal.endTime ?? "") === draft.endTime;
}
function formatWhen(event, onDay) {
	const occ = onDay ? occurrenceOn(event, onDay) : null;
	const startDate = occ?.start ?? event.startDate;
	const endDate = occ?.end ?? event.endDate;
	const day = (iso) => format(parseISO(iso), "d MMM", { locale: pl }).replace(/\./g, "");
	return [
		startDate && endDate && endDate !== startDate ? `${day(startDate)} – ${day(endDate)}` : startDate ? day(startDate) : endDate ? day(endDate) : "",
		event.startTime && event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime ? `od ${event.startTime}` : event.endTime ? `do ${event.endTime}` : "",
		ruleOf(event) === "none" ? "" : repeatLabel(ruleOf(event)).toLowerCase()
	].filter(Boolean).join(" · ") || "Bez terminu";
}
function eventTitle(title) {
	return title.trim() || "Bez nazwy";
}
function plCount(n, one, few, many) {
	const abs = Math.abs(n);
	const m10 = abs % 10;
	const m100 = abs % 100;
	return `${n} ${abs === 1 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many}`;
}
function errorText(err) {
	const raw = err instanceof Error ? err.message : "";
	if (/unauthorized/i.test(raw)) return "Sesja wygasła. Zaloguj się ponownie.";
	if (/nie |podaj |koniec |możesz |nieprawid|nie znaleziono|nie udało|hasło|konto|e-mail|email/i.test(raw)) return raw;
	return "Nie udało się zapisać. Spróbuj jeszcze raz.";
}
//#endregion
export { sameSlot as _, authMiddleware as a, errorText as c, isRepeatRule as d, monthCells as f, sameMonth as g, plCount as h, WEEKDAYS as i, eventTitle as l, monthTitle as m, EVENT_COLORS as n, coversDay as o, monthCursor as p, REPEAT_OPTIONS as r, dayTitle as s, COLOR_IDS as t, formatWhen as u, shiftMonth as v, todayIso as y };
