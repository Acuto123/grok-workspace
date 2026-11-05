import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CalendarScreen } from "@/components/calendar/calendar-screen";
import { Mark } from "@/components/mark";
import { SignInCard } from "@/components/sign-in-card";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return <BootScreen />;
  return <HomeReady />;
}

function HomeReady() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <BootScreen />;
  if (!user) return <SignInCard />;
  return <CalendarScreen user={user} />;
}

export function BootScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 text-ink">
      <div className="flex flex-col items-center gap-3">
        <Mark className="size-12" />
        <p className="font-display text-3xl font-medium tracking-tight">Zbiórka</p>
        <p className="text-sm text-muted">Wczytuję…</p>
      </div>
    </main>
  );
}
