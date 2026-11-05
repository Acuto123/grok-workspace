import { useState, type FormEvent } from "react";
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { Mark } from "@/components/mark";
import { btnInk, btnLine, btnQuiet, fieldClass } from "@/components/controls";

type Mode = "register" | "login";

function authError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("already") || text.includes("exist")) {
    return "To konto już istnieje. Zaloguj się.";
  }
  if (text.includes("invalid") || text.includes("credential") || text.includes("password")) {
    return "Nieprawidłowy e-mail albo hasło.";
  }
  if (text.includes("short") || text.includes("8")) {
    return "Hasło musi mieć co najmniej 8 znaków.";
  }
  if (text.includes("email")) return "Podaj poprawny adres e-mail.";
  return "Nie udało się zalogować. Spróbuj ponownie.";
}

export function SignInCard() {
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (mode === "register" && password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    setPending(true);
    try {
      const result =
        mode === "register"
          ? await authClient.signUp.email({
              email: email.trim(),
              password,
              name: name.trim() || email.trim().split("@")[0] || "Użytkownik",
            })
          : await authClient.signIn.email({
              email: email.trim(),
              password,
            });
      if (result.error) setError(authError(result.error.message ?? ""));
    } catch (err) {
      setError(authError(err instanceof Error ? err.message : ""));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 md:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="max-w-md">
          <Mark className="size-12" />
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Zbiórka
          </h1>
          <p className="mt-4 text-pretty text-muted">
            Wspólny kalendarz grupy. Ktoś dodaje „Siłkę”, inni głosują na godzinę i zaznaczają,
            czy przyjdą. Wydarzenie może wracać co tydzień, miesiąc albo rok.
          </p>
          <ul className="mt-6 list-none space-y-2 p-0 text-sm">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-ink" aria-hidden="true" />
              Każdy może dodać wydarzenie
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-ink" aria-hidden="true" />
              Głos na godzinę, bez dublowania propozycji
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-ink" aria-hidden="true" />
              Powtarzanie: tydzień, miesiąc, rok
            </li>
          </ul>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-line bg-paper-2 p-4"
        >
          <h2 className="font-display text-2xl font-medium">
            {mode === "register" ? "Załóż konto" : "Zaloguj się"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Wszyscy zalogowani widzą ten sam kalendarz.
          </p>

          <div className="mt-4 grid gap-3">
            {mode === "register" ? (
              <label className="grid gap-1 text-sm font-medium">
                Imię
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  maxLength={80}
                  required
                  placeholder="Ania"
                />
              </label>
            ) : null}
            <label className="grid gap-1 text-sm font-medium">
              E-mail
              <input
                className={fieldClass}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                spellCheck={false}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Hasło
              <input
                className={fieldClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                minLength={mode === "register" ? 8 : undefined}
              />
            </label>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button className={`${btnInk} mt-4 w-full`} type="submit" disabled={pending}>
            {pending ? "Chwila…" : mode === "register" ? "Załóż konto" : "Zaloguj się"}
          </button>

          <button
            type="button"
            className={`${btnQuiet} mt-1 w-full`}
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError(null);
            }}
          >
            {mode === "register" ? "Mam już konto" : "Nie masz konta? Załóż je"}
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" />
            albo
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2">
            {GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                className={`${btnLine} w-full`}
                onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
              >
                Kontynuuj z {provider.label}
              </button>
            ))}
          </div>
        </form>
      </div>
      <p className="mt-8 text-sm text-faint">
        W Chrome: menu przeglądarki, potem „Zainstaluj Zbiórkę”.
      </p>
    </main>
  );
}
