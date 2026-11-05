import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { _ as sameSlot, a as authMiddleware, c as errorText, d as isRepeatRule, f as monthCells, g as sameMonth, h as plCount, i as WEEKDAYS, l as eventTitle, m as monthTitle, n as EVENT_COLORS, o as coversDay, p as monthCursor, r as REPEAT_OPTIONS, s as dayTitle, t as COLOR_IDS, u as formatWhen, v as shiftMonth, y as todayIso } from "./present-C7KVW0aI.mjs";
import "./client-CoMeym3u.mjs";
import { a as hasGateSessionMarker } from "./server-BGTX7jer.mjs";
import { a as MapPin, c as ChevronRight, i as Plus, l as ChevronLeft, o as Download, r as Trash2, s as Clock, t as X, u as Ban } from "../_libs/lucide-react.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { r as Mark } from "./router-CovLIs2w.mjs";
import { a as fieldClass, i as btnQuiet, n as btnInk, o as useCurrentUser, r as btnLine, s as useCurrentUserState, t as SignInCard } from "./sign-in-card-CGOq8NZK.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DUI0yhOL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	(0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			false
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var calendarQueryKey = ["calendar"];
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
var listCalendar = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("726d8fd52d013193c4b7b47eae0d3bb23dc2f406b69a6867eca7e5cadde9400e"));
var createEvent = createServerFn({ method: "POST" }).validator((input) => cleanEvent(input)).middleware([authMiddleware]).handler(createSsrRpc("3f31968a7ac28be556269c3f2eba8c512db4df18fe88099d40c59cbdb3f9d27f"));
var updateEvent = createServerFn({ method: "POST" }).validator((input) => {
	return {
		...cleanEvent(input),
		id: cleanId(asRecord(input).id)
	};
}).middleware([authMiddleware]).handler(createSsrRpc("9e1a8ede589a46d3065863aba4ed29fa5107735da2e9af1ed57c36464344480c"));
var deleteEvent = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(createSsrRpc("b73f8562b92e2c8d8eb6715fbb25d72d126d8185f0b8d2c1622038098fc7bf32"));
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
}).middleware([authMiddleware]).handler(createSsrRpc("3e98f0b1dea4d7a6489b22a8a56b9002caafa86cacd96462e192776b55385cbb"));
var voteProposal = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(createSsrRpc("e140b5c95246b1b9cb5ded95ada99d8e00b1fed5b3af2e2b8b7219f5fafc3297"));
var deleteProposal = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(createSsrRpc("35f689aa4e0818ec1d8485903840b268e8f8e83d55becb92c4d7042c74493faa"));
var applyProposal = createServerFn({ method: "POST" }).validator((id) => cleanId(id)).middleware([authMiddleware]).handler(createSsrRpc("8258a20d4f4b9f54ca80ebf878bebf951a61cdaf80e6aa46be79b4c4c07ea3a7"));
var setRsvp = createServerFn({ method: "POST" }).validator((input) => {
	const data = asRecord(input);
	const eventId = cleanId(data.eventId);
	const status = data.status;
	if (status !== "yes" && status !== "maybe" && status !== "no" && status !== "clear") throw new Error("Nieprawidłowa obecność");
	return {
		eventId,
		status
	};
}).middleware([authMiddleware]).handler(createSsrRpc("5148ad17e26b311e36f7d46a4810b452fdc6c1af0921867282cd475b7aa5d4c5"));
function InstallButton() {
	const [prompt, setPrompt] = (0, import_react.useState)(null);
	const [hidden, setHidden] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const onPrompt = (event) => {
			event.preventDefault();
			setPrompt(event);
		};
		const onInstalled = () => setHidden(true);
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);
	if (!prompt || hidden) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: btnLine,
		onClick: () => {
			prompt.prompt().then(() => setPrompt(null));
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
			className: "size-4",
			"aria-hidden": "true"
		}), "Zainstaluj"]
	});
}
function blankEvent(day) {
	return {
		title: "",
		color: "",
		startDate: day ?? "",
		endDate: day ?? "",
		startTime: "",
		endTime: "",
		location: "",
		repeat: "none"
	};
}
function toForm(event) {
	return {
		title: event.title,
		color: event.color,
		startDate: event.startDate ?? "",
		endDate: event.endDate ?? "",
		startTime: event.startTime ?? "",
		endTime: event.endTime ?? "",
		location: event.location,
		repeat: event.repeat || "none"
	};
}
function EventDialog({ mode, event, proposals, votes, rsvps, me, initialDay, onClose, onResult }) {
	const [editing, setEditing] = (0, import_react.useState)(mode === "create");
	const [form, setForm] = (0, import_react.useState)(() => mode === "create" || !event ? blankEvent(initialDay) : toForm(event));
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [proposal, setProposal] = (0, import_react.useState)({
		startDate: event?.startDate ?? initialDay ?? "",
		startTime: "",
		endTime: "",
		note: ""
	});
	const [pickedId, setPickedId] = (0, import_react.useState)(null);
	const mine = rsvps.find((row) => row.userId === me)?.status ?? null;
	const picked = proposals.find((item) => item.id === pickedId) ?? null;
	const draftSlot = {
		startDate: proposal.startDate,
		endDate: proposal.startDate,
		startTime: proposal.startTime,
		endTime: proposal.endTime
	};
	const matched = proposals.find((item) => sameSlot(item, draftSlot)) ?? null;
	const matchedVoted = matched ? votes.some((vote) => vote.proposalId === matched.id && vote.userId === me) : false;
	const showDock = !editing && Boolean(event) && proposals.length > 0;
	const ranked = [...proposals].sort((a, b) => {
		const count = (id) => votes.filter((vote) => vote.proposalId === id).length;
		const diff = count(b.id) - count(a.id);
		if (diff !== 0) return diff;
		return a.createdAt.localeCompare(b.createdAt);
	});
	const pickedMine = picked ? votes.some((vote) => vote.proposalId === picked.id && vote.userId === me) : false;
	function patch(partial) {
		setForm((current) => ({
			...current,
			...partial
		}));
	}
	async function run(action, close) {
		setPending(true);
		setError(null);
		try {
			onResult(await action(), close);
			return true;
		} catch (err) {
			setError(errorText(err));
			return false;
		} finally {
			setPending(false);
		}
	}
	async function saveEvent(submit) {
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
		if (await run(() => updateEvent({ data: {
			...form,
			id: event.id
		} }), false)) setEditing(false);
	}
	const names = (status) => rsvps.filter((row) => row.status === status).map((row) => row.userId === me ? "Ty" : row.userName);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: (open) => {
			if (!open) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "sheet-backdrop fade-in" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: `sheet sheet-dock fade-in text-ink${showDock ? " sheet-tall" : ""}`,
			"aria-describedby": "event-help",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sheet-scroll",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "font-display text-2xl font-medium",
							children: mode === "create" ? "Nowe wydarzenie" : editing ? "Edycja wydarzenia" : eventTitle(event?.title ?? "")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
							className: btnQuiet,
							"aria-label": "Zamknij",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						id: "event-help",
						className: "mt-1 text-sm text-muted",
						children: "Nic nie jest wymagane. Puste pola można uzupełnić później."
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-danger",
						role: "alert",
						children: error
					}) : null,
					editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-4 grid gap-4",
						onSubmit: saveEvent,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1 text-sm font-medium",
								children: ["Nazwa", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "event-title",
									className: fieldClass,
									value: form.title,
									onChange: (input) => patch({ title: input.target.value }),
									placeholder: "np. Siłka",
									maxLength: 120,
									autoComplete: "off"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
								className: "text-sm font-medium",
								children: "Kolor"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: EVENT_COLORS.map((swatch) => {
									const selected = form.color === swatch.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": swatch.label,
										"aria-pressed": selected,
										className: `grid size-11 place-items-center rounded-full border ${selected ? "border-ink ring-2 ring-ink" : "border-line"}`,
										style: { background: swatch.id || "transparent" },
										onClick: () => patch({ color: swatch.id }),
										children: swatch.id ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, {
											className: "size-4 text-faint",
											"aria-hidden": "true"
										})
									}, swatch.id || "none");
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
								className: "text-sm font-medium",
								children: "Dni"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm text-muted",
									children: ["Od", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "event-start-date",
										className: fieldClass,
										type: "date",
										value: form.startDate,
										onChange: (input) => patch({ startDate: input.target.value })
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm text-muted",
									children: ["Do", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "event-end-date",
										className: fieldClass,
										type: "date",
										value: form.endDate,
										onChange: (input) => patch({ endDate: input.target.value })
									})]
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
								className: "text-sm font-medium",
								children: "Godziny"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm text-muted",
									children: ["Od", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "event-start-time",
										className: fieldClass,
										type: "time",
										value: form.startTime,
										onChange: (input) => patch({ startTime: input.target.value })
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm text-muted",
									children: ["Do", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "event-end-time",
										className: fieldClass,
										type: "time",
										value: form.endTime,
										onChange: (input) => patch({ endTime: input.target.value })
									})]
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1 text-sm font-medium",
								children: ["Powtarzanie", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									id: "event-repeat",
									className: fieldClass,
									value: form.repeat,
									onChange: (input) => {
										if (isRepeatRule(input.target.value)) patch({ repeat: input.target.value });
									},
									children: REPEAT_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: option.id,
										children: option.label
									}, option.id))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1 text-sm font-medium",
								children: ["Miejsce", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "event-location",
									className: fieldClass,
									value: form.location,
									onChange: (input) => patch({ location: input.target.value }),
									placeholder: "np. siłownia na Grunwaldzkiej",
									maxLength: 200,
									autoComplete: "off"
								})]
							}),
							form.startDate || form.endDate || form.startTime || form.endTime ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${btnQuiet} justify-start px-0`,
								onClick: () => patch({
									startDate: "",
									endDate: "",
									startTime: "",
									endTime: ""
								}),
								children: "Wyczyść termin"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									id: "save-event",
									className: btnInk,
									type: "submit",
									disabled: pending,
									children: pending ? "Zapisywanie…" : mode === "create" ? "Dodaj wydarzenie" : "Zapisz zmiany"
								}), mode === "event" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: btnLine,
									onClick: () => {
										if (event) setForm(toForm(event));
										setEditing(false);
										setError(null);
									},
									children: "Anuluj"
								}) : null]
							})
						]
					}) : event ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 h-12 w-1.5 shrink-0 rounded-full",
									style: { background: event.color || "var(--color-line-strong)" }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted tabular-nums",
											children: formatWhen(event)
										}),
										event.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 flex items-center gap-1 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
												className: "size-4 shrink-0",
												"aria-hidden": "true"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "break-words",
												children: event.location
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-faint",
											children: "Bez miejsca"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-sm text-faint",
											children: ["Od ", event.creatorName]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-semibold",
									children: "Kto przychodzi"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 grid grid-cols-3 gap-2",
									children: [
										["yes", "Przyjdę"],
										["maybe", "Może"],
										["no", "Nie przyjdę"]
									].map(([status, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": mine === status,
										disabled: pending,
										className: twMerge(mine === status ? btnInk : btnLine, "h-auto min-h-11 w-full px-1 text-center"),
										onClick: () => void run(() => setRsvp({ data: {
											eventId: event.id,
											status: mine === status ? "clear" : status
										} }), false),
										children: label
									}, status))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 grid gap-1 text-sm text-muted",
									children: [
										names("yes").length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Przyjdą: ", names("yes").join(", ")] }) : null,
										names("maybe").length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Może: ", names("maybe").join(", ")] }) : null,
										names("no").length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Nie przyjdą: ", names("no").join(", ")] }) : null,
										rsvps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Nikt jeszcze nie zaznaczył obecności." }) : null
									]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "flex items-center gap-2 text-sm font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Propozycje godzin"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: "Kliknij godzinę, a na dole naciśnij Zagłosuj. Ta sama godzina nie dubluje się."
								}),
								ranked.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted",
									children: "Nikt jeszcze nie podał godziny. Dopisz swoją — reszta grupy zagłosuje na nią."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 grid gap-2",
									children: ranked.map((item) => {
										const itemVotes = votes.filter((vote) => vote.proposalId === item.id);
										const voted = itemVotes.some((vote) => vote.userId === me);
										const selected = picked?.id === item.id;
										const who = itemVotes.map((vote) => vote.userId === me ? "Ty" : vote.userName).join(", ");
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											"aria-pressed": selected,
											className: twMerge("w-full rounded-sm border px-3 py-3 text-left", selected ? "border-ink bg-paper" : "border-line bg-paper"),
											onClick: () => setPickedId(item.id),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-baseline justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-sm font-semibold tabular-nums",
														children: formatWhen(item)
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "shrink-0 text-xs text-muted",
														children: plCount(itemVotes.length, "głos", "głosy", "głosów")
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "mt-1 block text-sm text-muted",
													children: [item.userId === me ? "Ty" : item.userName, voted ? " · Twój głos" : ""]
												}),
												who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-1 block text-sm",
													children: who
												}) : null,
												item.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-1 block font-display text-base text-muted",
													children: item.note
												}) : null
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 flex flex-wrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: btnQuiet,
												disabled: pending,
												onClick: () => void run(() => applyProposal({ data: item.id }), false),
												children: "Ustaw jako termin"
											}), item.userId === me ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: btnQuiet,
												disabled: pending,
												onClick: () => {
													if (pickedId === item.id) setPickedId(null);
													run(() => deleteProposal({ data: item.id }), false);
												},
												children: "Usuń"
											}) : null]
										})] }, item.id);
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "mt-3 grid gap-2",
									onSubmit: (submit) => {
										submit.preventDefault();
										if (matched) setPickedId(matched.id);
										if (matchedVoted) return;
										run(() => addProposal({ data: {
											eventId: event.id,
											startDate: proposal.startDate,
											endDate: proposal.startDate,
											startTime: proposal.startTime,
											endTime: proposal.endTime,
											note: proposal.note
										} }), false).then((ok) => {
											if (!ok) return;
											setProposal({
												startDate: event.startDate ?? "",
												startTime: "",
												endTime: "",
												note: ""
											});
										});
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium",
											children: matched ? "Ta godzina już jest" : "Nowa godzina"
										}),
										matched ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted",
											children: "Nie dodajemy drugiej takiej samej. Zagłosuj na istniejącą."
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 gap-2 sm:grid-cols-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													id: "proposal-date",
													"aria-label": "Dzień propozycji",
													className: fieldClass,
													type: "date",
													value: proposal.startDate,
													onChange: (input) => setProposal((current) => ({
														...current,
														startDate: input.target.value
													}))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													id: "proposal-start",
													"aria-label": "Godzina od",
													className: fieldClass,
													type: "time",
													value: proposal.startTime,
													onChange: (input) => setProposal((current) => ({
														...current,
														startTime: input.target.value
													}))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													id: "proposal-end",
													"aria-label": "Godzina do",
													className: fieldClass,
													type: "time",
													value: proposal.endTime,
													onChange: (input) => setProposal((current) => ({
														...current,
														endTime: input.target.value
													}))
												})
											]
										}),
										matched ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "proposal-note",
											className: fieldClass,
											value: proposal.note,
											onChange: (input) => setProposal((current) => ({
												...current,
												note: input.target.value
											})),
											placeholder: "Notatka, np. po pracy",
											maxLength: 280
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											id: "add-proposal",
											className: btnLine,
											type: "submit",
											disabled: pending || matchedVoted,
											children: matchedVoted ? "Już zagłosowane" : matched ? "Zagłosuj na tę godzinę" : "Zaproponuj godzinę"
										})
									]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2 border-t border-line pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: btnLine,
									onClick: () => {
										setForm(toForm(event));
										setEditing(true);
										setError(null);
									},
									children: "Edytuj"
								}), confirmDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: twMerge(btnInk, "bg-danger"),
									disabled: pending,
									onClick: () => void run(() => deleteEvent({ data: event.id }), true),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Potwierdź usunięcie"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: `${btnQuiet} text-danger`,
									onClick: () => setConfirmDelete(true),
									children: "Usuń"
								})]
							})
						]
					}) : null
				]
			}), showDock ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sheet-dockbar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					id: "vote-proposal",
					type: "button",
					className: `${btnInk} w-full`,
					disabled: !picked || pending,
					onClick: () => {
						if (!picked) return;
						run(() => voteProposal({ data: picked.id }), false);
					},
					children: pickedMine ? "Cofnij głos" : "Zagłosuj"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-center text-xs text-muted",
					children: picked ? formatWhen(picked) : "Wybierz propozycję powyżej"
				})]
			}) : null]
		})] })
	});
}
function CalendarScreen({ user }) {
	const revision = (0, import_react.useRef)(0);
	const queryClient = useQueryClient();
	const agendaRef = (0, import_react.useRef)(null);
	const [cursor, setCursor] = (0, import_react.useState)(() => monthCursor());
	const [selected, setSelected] = (0, import_react.useState)(() => todayIso());
	const [dialog, setDialog] = (0, import_react.useState)(null);
	const query = useQuery({
		queryKey: calendarQueryKey,
		queryFn: async () => {
			const started = revision.current;
			const snapshot = await listCalendar();
			if (revision.current !== started) return queryClient.getQueryData(calendarQueryKey) ?? snapshot;
			return snapshot;
		},
		refetchInterval: 4e3
	});
	const data = query.data;
	const events = data?.events ?? [];
	const cells = (0, import_react.useMemo)(() => monthCells(cursor), [cursor]);
	const byDay = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		const days = new Set(cells);
		days.add(selected);
		for (const iso of days) {
			const list = events.filter((event) => coversDay(event, iso));
			if (list.length) map.set(iso, list);
		}
		return map;
	}, [
		events,
		cells,
		selected
	]);
	const loose = events.filter((event) => !event.startDate && !event.endDate);
	const dayEvents = byDay.get(selected) ?? [];
	const today = todayIso();
	function selectDay(iso) {
		setSelected(iso);
		if (!sameMonth(iso, cursor)) setCursor(`${iso.slice(0, 7)}-01`);
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		agendaRef.current?.scrollIntoView({
			behavior: reduce ? "auto" : "smooth",
			block: "nearest"
		});
	}
	function goMonth(delta) {
		const next = shiftMonth(cursor, delta);
		setCursor(next);
		if (!sameMonth(selected, next)) setSelected(sameMonth(today, next) ? today : next);
	}
	function onResult(result, close) {
		revision.current += 1;
		queryClient.setQueryData(calendarQueryKey, result.snapshot);
		if (close || dialog?.type === "event" && !result.snapshot.events.some((event) => event.id === dialog.id) && !result.focusId) {
			setDialog(null);
			return;
		}
		if (result.focusId) setDialog({
			type: "event",
			id: result.focusId
		});
	}
	const openEvent = dialog?.type === "event" ? events.find((event) => event.id === dialog.id) ?? null : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl font-medium tracking-tight",
						children: "Zbiórka"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Wspólny kalendarz"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Presence, {
							people: data?.people ?? [],
							me: user.id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallButton, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							id: "new-event",
							type: "button",
							className: btnLine,
							onClick: () => setDialog({
								type: "create",
								day: null
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Nowe"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid items-start gap-6 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "lg:col-span-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-medium md:text-3xl",
							children: monthTitle(cursor)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: `${btnLine} w-11 px-0`,
									"aria-label": "Poprzedni miesiąc",
									onClick: () => goMonth(-1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: btnLine,
									onClick: () => {
										setCursor(monthCursor());
										setSelected(today);
									},
									children: "Dziś"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: `${btnLine} w-11 px-0`,
									"aria-label": "Następny miesiąc",
									onClick: () => goMonth(1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-hidden rounded-xl border border-line bg-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-7 gap-px",
							children: [WEEKDAYS.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-paper px-1 py-2 text-center text-xs font-medium text-faint",
								children: day
							}, day)), cells.map((iso) => {
								const list = byDay.get(iso) ?? [];
								const inMonth = sameMonth(iso, cursor);
								const isSelected = iso === selected;
								const isToday = iso === today;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => selectDay(iso),
									"aria-pressed": isSelected,
									"aria-current": isToday ? "date" : void 0,
									"aria-label": `${dayTitle(iso)}, ${list.length} wydarzeń`,
									className: `flex min-h-16 min-w-0 flex-col gap-1 bg-paper-2 p-1 text-left transition-colors duration-150 hover:bg-paper md:min-h-28 md:p-2 ${isSelected ? "bg-paper" : ""}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `grid size-7 place-items-center rounded-full text-sm tabular-nums ${isSelected ? "bg-ink text-paper" : isToday ? "ring-1 ring-ink" : ""} ${inMonth ? "" : "text-faint"}`,
											children: Number(iso.slice(8))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "hidden min-w-0 flex-col gap-1 md:flex",
											children: [list.slice(0, 3).map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												title: eventTitle(event.title),
												className: "flex min-w-0 items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "h-3 w-1 shrink-0 rounded-full",
													style: { background: event.color || "var(--color-line-strong)" }
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate text-xs",
													children: eventTitle(event.title)
												})]
											}, event.id)), list.length > 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-faint",
												children: ["+", list.length - 3]
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex gap-1 md:hidden",
											children: list.slice(0, 3).map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "size-1.5 rounded-full",
												style: { background: event.color || "var(--color-line-strong)" }
											}, event.id))
										})
									]
								}, iso);
							})]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					ref: agendaRef,
					id: "agenda",
					className: "rounded-xl border border-line bg-paper-2 p-4 lg:col-span-2 lg:sticky lg:top-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-medium",
							children: dayTitle(selected)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							id: "add-event",
							type: "button",
							className: `${btnInk} mt-3 w-full`,
							onClick: () => setDialog({
								type: "create",
								day: selected
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "size-4",
								"aria-hidden": "true"
							}), selected === today ? "Dodaj na dziś" : "Dodaj na ten dzień"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: query.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Wczytuję kalendarz…"
							}) : query.isError && !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-danger",
									role: "alert",
									children: "Nie udało się wczytać kalendarza."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: btnLine,
									onClick: () => void query.refetch(),
									children: "Spróbuj ponownie"
								})]
							}) : dayEvents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-pretty text-muted",
								children: events.length === 0 ? "To wspólny kalendarz. Dodaj wydarzenie — inni zagłosują na godzinę i zaznaczą, czy przyjdą. Może wracać co tydzień, miesiąc albo rok." : "Tego dnia jest pusto."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "divide-y divide-line",
								children: dayEvents.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventRowButton, {
									event,
									day: selected,
									snapshot: data,
									onOpen: () => setDialog({
										type: "event",
										id: event.id
									})
								}, event.id))
							})
						}),
						loose.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 border-t border-line pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold",
								children: "Bez terminu"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "divide-y divide-line",
								children: loose.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventRowButton, {
									event,
									snapshot: data,
									onOpen: () => setDialog({
										type: "event",
										id: event.id
									})
								}, event.id))
							})]
						}) : null
					]
				})]
			}),
			dialog && (dialog.type === "create" || openEvent) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventDialog, {
				mode: dialog.type === "create" ? "create" : "event",
				event: openEvent,
				proposals: data?.proposals.filter((item) => item.eventId === openEvent?.id) ?? [],
				votes: data?.votes ?? [],
				rsvps: data?.rsvps.filter((item) => item.eventId === openEvent?.id) ?? [],
				me: user.id,
				initialDay: dialog.type === "create" ? dialog.day : null,
				onClose: () => setDialog(null),
				onResult
			}, dialog.type === "create" ? `create-${dialog.day ?? "empty"}` : dialog.id) : null
		]
	});
}
function Presence({ people, me }) {
	const label = people.length === 0 ? "Łączenie…" : people.every((person) => person.id === me) ? "Tylko ty jesteś teraz w kalendarzu" : `${plCount(people.length, "osoba", "osoby", "osób")} na żywo`;
	const shown = people.slice(0, 5);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex",
			"aria-hidden": "true",
			children: shown.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				title: person.name,
				className: "-ml-2 first:ml-0",
				children: person.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: person.image,
					alt: "",
					referrerPolicy: "no-referrer",
					className: "size-8 rounded-full border-2 border-paper object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-8 place-items-center rounded-full border-2 border-paper bg-ink text-xs font-semibold text-paper",
					children: (person.name.trim()[0] || "?").toUpperCase()
				})
			}, person.id))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "flex items-center gap-1 text-xs text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "size-2 rounded-full bg-pine",
				"aria-hidden": "true"
			}), label]
		})]
	});
}
function EventRowButton({ event, snapshot, day, onOpen }) {
	const yes = snapshot?.rsvps.filter((row) => row.eventId === event.id && row.status === "yes").length ?? 0;
	const top = [...snapshot?.proposals.filter((row) => row.eventId === event.id) ?? []].sort((a, b) => {
		const count = (id) => snapshot?.votes.filter((vote) => vote.proposalId === id).length ?? 0;
		return count(b.id) - count(a.id);
	})[0];
	const topVotes = top ? snapshot?.votes.filter((vote) => vote.proposalId === top.id).length ?? 0 : 0;
	const meta = [yes > 0 ? plCount(yes, "osoba", "osoby", "osób") : "", top && topVotes > 0 ? `${formatWhen(top)} · ${plCount(topVotes, "głos", "głosy", "głosów")}` : ""].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onOpen,
		className: "flex w-full min-w-0 gap-3 py-3 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 h-10 w-1.5 shrink-0 rounded-full",
			style: { background: event.color || "var(--color-line-strong)" }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-display text-xl font-medium",
					children: eventTitle(event.title)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm text-muted tabular-nums",
					children: formatWhen(event, day)
				}),
				event.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm",
					children: event.location
				}) : null,
				meta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-faint tabular-nums",
					children: meta
				}) : null
			]
		})]
	}) });
}
function Home() {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setReady(true);
	}, []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BootScreen, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeReady, {});
}
function HomeReady() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BootScreen, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInCard, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarScreen, { user });
}
function BootScreen() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-paper px-4 text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-12" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl font-medium tracking-tight",
					children: "Zbiórka"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Wczytuję…"
				})
			]
		})
	});
}
//#endregion
export { BootScreen, Home as component };
