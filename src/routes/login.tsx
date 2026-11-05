import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BootScreen } from "@/routes/index";
import { SignInCard } from "@/components/sign-in-card";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const { user, isPending } = useCurrentUserState();
  if (!ready || isPending) return <BootScreen />;
  if (user) return <Navigate to="/" />;
  return <SignInCard />;
}
