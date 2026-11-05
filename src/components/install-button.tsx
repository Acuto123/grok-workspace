import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { btnLine } from "@/components/controls";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
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

  return (
    <button
      type="button"
      className={btnLine}
      onClick={() => {
        void prompt.prompt().then(() => setPrompt(null));
      }}
    >
      <Download className="size-4" aria-hidden="true" />
      Zainstaluj
    </button>
  );
}
