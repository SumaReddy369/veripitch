"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

interface Props {
  dark?: boolean;
}

export function WaitlistForm({ dark = false }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/waitlist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: fullName.trim(), email }),
        },
      );

      if (res.ok) {
        router.push(`/waitlist/thanks?name=${encodeURIComponent(fullName.trim())}`);
      } else {
        setErrorMsg("Something went wrong — please try again.");
        setStatus("idle");
      }
    } catch {
      setErrorMsg("Could not connect. Please try again shortly.");
      setStatus("idle");
    }
  };

  const inputBase =
    "w-full rounded-lg px-4 py-3 text-sm outline-none transition-all";

  const inputClass = dark
    ? `${inputBase} bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30`
    : `${inputBase} bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100`;

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        required
        className={inputClass}
      />
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          required
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
            dark
              ? "bg-brand-500 text-white hover:bg-brand-400"
              : "bg-slate-900 text-white hover:bg-slate-700"
          }`}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Request Access
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      {errorMsg && (
        <p className={`text-xs ${dark ? "text-red-300" : "text-red-500"}`}>
          {errorMsg}
        </p>
      )}
    </form>
  );
}
