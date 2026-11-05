import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { r as signIn, t as authClient } from "./client-CoMeym3u.mjs";
import { t as GROK_PROVIDERS } from "./server-BGTX7jer.mjs";
import { r as Mark } from "./router-CovLIs2w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sign-in-card-CGOq8NZK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEV_STATE = {
	user: {
		id: "dev-user",
		displayName: "Dev User",
		primaryEmail: "dev@example.com",
		profileImageUrl: null,
		isDevFallback: true
	},
	isPending: false
};
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	return DEV_STATE;
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var btnInk = "inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-ink px-4 text-sm font-semibold text-paper transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
var btnLine = "inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-line bg-paper-2 px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50";
var btnQuiet = "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-3 text-sm font-semibold text-ink transition-opacity duration-150 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50";
var fieldClass = "h-11 w-full min-w-0 rounded-sm border border-line bg-paper px-3 text-sm text-ink placeholder:text-faint";
function authError(message) {
	const text = message.toLowerCase();
	if (text.includes("already") || text.includes("exist")) return "To konto już istnieje. Zaloguj się.";
	if (text.includes("invalid") || text.includes("credential") || text.includes("password")) return "Nieprawidłowy e-mail albo hasło.";
	if (text.includes("short") || text.includes("8")) return "Hasło musi mieć co najmniej 8 znaków.";
	if (text.includes("email")) return "Podaj poprawny adres e-mail.";
	return "Nie udało się zalogować. Spróbuj ponownie.";
}
function SignInCard() {
	const [mode, setMode] = (0, import_react.useState)("register");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		setError(null);
		if (mode === "register" && password.length < 8) {
			setError("Hasło musi mieć co najmniej 8 znaków.");
			return;
		}
		setPending(true);
		try {
			const result = mode === "register" ? await authClient.signUp.email({
				email: email.trim(),
				password,
				name: name.trim() || email.trim().split("@")[0] || "Użytkownik"
			}) : await authClient.signIn.email({
				email: email.trim(),
				password
			});
			if (result.error) setError(authError(result.error.message ?? ""));
		} catch (err) {
			setError(authError(err instanceof Error ? err.message : ""));
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 md:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid items-center gap-10 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-12" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl",
						children: "Zbiórka"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-pretty text-muted",
						children: "Wspólny kalendarz grupy. Ktoś dodaje „Siłkę”, inni głosują na godzinę i zaznaczają, czy przyjdą. Wydarzenie może wracać co tydzień, miesiąc albo rok."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-6 list-none space-y-2 p-0 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-1.5 rounded-full bg-ink",
									"aria-hidden": "true"
								}), "Każdy może dodać wydarzenie"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-1.5 rounded-full bg-ink",
									"aria-hidden": "true"
								}), "Głos na godzinę, bez dublowania propozycji"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-1.5 rounded-full bg-ink",
									"aria-hidden": "true"
								}), "Powtarzanie: tydzień, miesiąc, rok"]
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "rounded-xl border border-line bg-paper-2 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-medium",
						children: mode === "register" ? "Załóż konto" : "Zaloguj się"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Wszyscy zalogowani widzą ten sam kalendarz."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3",
						children: [
							mode === "register" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1 text-sm font-medium",
								children: ["Imię", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: fieldClass,
									value: name,
									onChange: (event) => setName(event.target.value),
									autoComplete: "name",
									maxLength: 80,
									required: true,
									placeholder: "Ania"
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1 text-sm font-medium",
								children: ["E-mail", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: fieldClass,
									type: "email",
									value: email,
									onChange: (event) => setEmail(event.target.value),
									autoComplete: "email",
									required: true,
									spellCheck: false
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1 text-sm font-medium",
								children: ["Hasło", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: fieldClass,
									type: "password",
									value: password,
									onChange: (event) => setPassword(event.target.value),
									autoComplete: mode === "register" ? "new-password" : "current-password",
									required: true,
									minLength: mode === "register" ? 8 : void 0
								})]
							})
						]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-danger",
						role: "alert",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: `${btnInk} mt-4 w-full`,
						type: "submit",
						disabled: pending,
						children: pending ? "Chwila…" : mode === "register" ? "Załóż konto" : "Zaloguj się"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${btnQuiet} mt-1 w-full`,
						onClick: () => {
							setMode(mode === "register" ? "login" : "register");
							setError(null);
						},
						children: mode === "register" ? "Mam już konto" : "Nie masz konta? Załóż je"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "my-4 flex items-center gap-3 text-xs text-faint",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" }),
							"albo",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2",
						children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `${btnLine} w-full`,
							onClick: () => signIn(provider.providerId, { callbackURL: "/" }),
							children: ["Kontynuuj z ", provider.label]
						}, provider.providerId))
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-sm text-faint",
			children: "W Chrome: menu przeglądarki, potem „Zainstaluj Zbiórkę”."
		})]
	});
}
//#endregion
export { fieldClass as a, btnQuiet as i, btnInk as n, useCurrentUser as o, btnLine as r, useCurrentUserState as s, SignInCard as t };
