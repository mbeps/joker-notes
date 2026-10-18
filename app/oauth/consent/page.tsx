"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function getClientDisplayName(
  clientId: string | null,
  clientName: string | null,
): string {
  if (clientName) return clientName;
  if (!clientId) return "AI Assistant";

  const lower = clientId.toLowerCase();
  if (lower.includes("chatgpt")) return "ChatGPT";
  if (lower.includes("gemini")) return "Google Gemini";
  if (lower.includes("claude")) return "Claude";
  if (lower.includes("cursor")) return "Cursor";
  if (lower.startsWith("client_")) return "AI Assistant";

  return clientId;
}

function ConsentCard() {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id");
  const clientNameParam = searchParams.get("client_name");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope") || "";
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod =
    (searchParams.get("code_challenge_method") as "S256" | "plain") || "S256";

  const [isLoading, setIsLoading] = useState(false);
  const clientDisplayName = getClientDisplayName(clientId, clientNameParam);

  const handleDecision = async (decision: "allow" | "deny") => {
    if (!redirectUri) {
      toast.error("Missing redirect URI in authorization request");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          client_id: clientId,
          redirect_uri: redirectUri,
          scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
        }),
      });

      const data = (await res.json()) as {
        redirect_url?: string;
        error?: string;
      };

      if (!res.ok || !data.redirect_url) {
        throw new Error(data.error || "Failed to process authorization");
      }

      window.location.href = data.redirect_url;
    } catch (error) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : "Error occurred";
      toast.error(message);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="font-bold text-foreground text-xl tracking-tight">
          Sign In Required
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Please sign in to your Joker Notes account to authorize{" "}
          <strong>{clientDisplayName}</strong>.
        </p>
        <div className="mt-6">
          <SignInButton mode="modal">
            <Button className="h-11 w-full rounded-xl">
              Sign In with Clerk
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 shadow-xs">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
        <ShieldCheck className="size-6" />
      </div>

      <h1 className="text-center font-bold text-foreground text-xl tracking-tight">
        Authorise Application
      </h1>

      <p className="mt-2 text-center text-muted-foreground text-sm">
        <strong className="text-foreground">{clientDisplayName}</strong> is
        requesting access to your Joker Notes account.
      </p>

      <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4">
        <h2 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
          REQUESTED PERMISSIONS
        </h2>

        <div className="mt-3 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
            <div>
              <p className="font-semibold text-foreground text-sm">
                Read and manage your notes
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                Allows viewing, creating, updating, and deleting notes on your
                behalf.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
            <div>
              <p className="font-semibold text-foreground text-sm">
                Offline access
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                Allows the assistant to keep working across sessions without
                re-prompting.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-muted-foreground text-xs leading-relaxed">
        Authorising will redirect you back to the client application. You can
        disconnect at any time.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          onClick={() => handleDecision("deny")}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Deny"}
        </Button>

        <Button
          className="h-11 flex-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          onClick={() => handleDecision("allow")}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Allow Access"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-border/50 border-b px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-base text-foreground tracking-tight">
              Joker Notes
            </span>
          </Link>

          <div>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center p-4">
        <Suspense
          fallback={
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ConsentCard />
        </Suspense>
      </main>
    </div>
  );
}
