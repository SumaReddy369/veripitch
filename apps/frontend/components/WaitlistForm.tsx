"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/waitlist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="font-semibold text-green-800">You're on the list!</p>
          <p className="text-sm text-green-600">We'll reach out to {email} when we launch.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary rounded-xl px-6 py-3 text-sm"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Join Waitlist
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {status === "error" && (
        <p className="w-full text-center text-xs text-red-500">
          Something went wrong — try again or email us directly.
        </p>
      )}
    </form>
  );
}
