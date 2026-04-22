"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Clock, Download } from "lucide-react";

const ROWS = [
  {
    q: "Describe your approach to data encryption at rest and in transit.",
    a: "All data is encrypted using AES-256 at rest. In transit, we enforce TLS 1.3 with perfect forward secrecy. Encryption keys are managed via AWS KMS with 90-day rotation.",
    source: "security_policy.pdf · p.4",
    confidence: 91,
  },
  {
    q: "Do you hold an active SOC 2 Type II certification?",
    a: "Yes. We achieved SOC 2 Type II in March 2024, covering the Security, Availability, and Confidentiality trust service criteria. The report is available under NDA.",
    source: "soc2_report.pdf · p.2",
    confidence: 95,
  },
  {
    q: "What is your SLA for critical (P1) incident response?",
    a: "P1 incidents are acknowledged within 15 minutes and resolved within 4 hours. We guarantee 99.95% uptime under our Enterprise SLA, with credits issued for any breach.",
    source: "enterprise_sla.pdf · p.7",
    confidence: 88,
  },
  {
    q: "How do you handle subprocessors and third-party data access?",
    a: "We maintain a published subprocessor list, updated 30 days before any change. All subprocessors are contractually bound to GDPR-equivalent protections and undergo annual audits.",
    source: "data_processing_addendum.pdf · p.11",
    confidence: 83,
  },
];

function useTypewriter(text: string, active: boolean, speed = 14) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) { setOut(""); return; }
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return out;
}

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : score >= 80 ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${color}`}>
      {score}%
    </span>
  );
}

type RowState = "waiting" | "typing" | "done" | "approved";

export function AnimatedDemo() {
  const [phase, setPhase] = useState<"intro" | "running" | "complete">("intro");
  const [rowStates, setRowStates] = useState<RowState[]>(ROWS.map(() => "waiting"));
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => timerRef.current.forEach(clearTimeout);

  const runSequence = () => {
    setPhase("running");
    setRowStates(ROWS.map(() => "waiting"));
    clearTimers();

    const typeDuration = (text: string) => Math.max(text.length * 14 + 400, 1200);
    let cursor = 600;

    ROWS.forEach((row, i) => {
      // Start typing this row
      const t1 = setTimeout(() => {
        setRowStates((s) => s.map((v, j) => (j === i ? "typing" : v)));
      }, cursor);
      cursor += typeDuration(row.a);
      timerRef.current.push(t1);

      // Mark done
      const t2 = setTimeout(() => {
        setRowStates((s) => s.map((v, j) => (j === i ? "done" : v)));
      }, cursor);
      cursor += 200;
      timerRef.current.push(t2);
    });

    // Approve all rows one by one
    ROWS.forEach((_, i) => {
      cursor += 300;
      const t = setTimeout(() => {
        setRowStates((s) => s.map((v, j) => (j === i ? "approved" : v)));
      }, cursor);
      timerRef.current.push(t);
    });

    // Show complete
    cursor += 800;
    const tFinal = setTimeout(() => {
      setPhase("complete");
    }, cursor);
    timerRef.current.push(tFinal);

    // Restart loop
    cursor += 3000;
    const tRestart = setTimeout(() => {
      runSequence();
    }, cursor);
    timerRef.current.push(tRestart);
  };

  useEffect(() => {
    const intro = setTimeout(runSequence, 1200);
    return () => { clearTimeout(intro); clearTimers(); };
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-medium text-slate-400">vendor_rfp_q1_2026.xlsx — VeriPitch</span>
        </div>
        <div className="flex items-center gap-2">
          {phase === "complete" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle className="h-3 w-3" /> All approved
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              <Clock className="h-3 w-3 animate-pulse" /> Processing…
            </span>
          )}
        </div>
      </div>

      {/* ── Column headers ── */}
      <div className="grid grid-cols-[1.8fr_2.2fr_90px_90px] border-b border-slate-100 bg-slate-50/50 px-5 py-2">
        {["RFP Question (Column A)", "AI-Generated Answer (Column B)", "Confidence", "Status"].map((h) => (
          <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
        ))}
      </div>

      {/* ── Rows ── */}
      <div className="divide-y divide-slate-50">
        {ROWS.map((row, i) => {
          const state = rowStates[i];
          const isTyping = state === "typing";
          const isDone = state === "done" || state === "approved";
          const isApproved = state === "approved";
          const answer = useTypewriter(row.a, isTyping || isDone, 14); // eslint-disable-line react-hooks/rules-of-hooks

          return (
            <div
              key={i}
              className={`grid grid-cols-[1.8fr_2.2fr_90px_90px] items-start gap-4 px-5 py-3.5 transition-colors duration-300 ${isApproved ? "bg-emerald-50/40" : "bg-white"}`}
            >
              {/* Question */}
              <p className="text-[13px] leading-relaxed text-slate-500">{row.q}</p>

              {/* Answer */}
              <div className="min-h-[40px]">
                <p className="text-[13px] leading-relaxed text-slate-800">
                  {isTyping ? (
                    <>
                      {answer}
                      <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-[pulse_0.8s_ease-in-out_infinite] bg-brand-500 align-middle" />
                    </>
                  ) : isDone ? (
                    answer
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </p>
                {isDone && (
                  <p className="mt-1 text-[11px] text-slate-400">{row.source}</p>
                )}
              </div>

              {/* Confidence */}
              <div className="pt-0.5">
                {isDone ? <ConfidenceBadge score={row.confidence} /> : <span className="text-slate-200 text-xs">—</span>}
              </div>

              {/* Status */}
              <div className="pt-0.5">
                {isApproved ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" /> Approved
                  </span>
                ) : isDone ? (
                  <span className="rounded-md border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-400">Review</span>
                ) : (
                  <span className="text-slate-200 text-xs">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        <p className="text-xs text-slate-400">
          {rowStates.filter((s) => s === "approved").length} of {ROWS.length} approved
        </p>
        <button
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${phase === "complete" ? "bg-brand-600 text-white shadow-sm shadow-brand-200" : "bg-slate-100 text-slate-300 cursor-default"}`}
          disabled={phase !== "complete"}
        >
          <Download className="h-3.5 w-3.5" />
          Export to Excel
        </button>
      </div>
    </div>
  );
}
