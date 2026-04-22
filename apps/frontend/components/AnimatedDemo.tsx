"use client";

import { useEffect, useState } from "react";
import { CheckCircle, FileText, Database, Zap, Download } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────
const DEMO_ROWS = [
  {
    question: "Describe your data encryption standards at rest and in transit.",
    answer: "All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Keys are managed via AWS KMS with automatic 90-day rotation.",
    confidence: 91,
    source: "security_policy.pdf, Page 4",
  },
  {
    question: "Do you hold a SOC 2 Type II certification?",
    answer: "Yes. We achieved SOC 2 Type II certification in March 2024, covering Security, Availability, and Confidentiality trust principles.",
    confidence: 95,
    source: "compliance_certs.pdf, Page 2",
  },
  {
    question: "What is your SLA for critical incident response?",
    answer: "P1 incidents are acknowledged within 15 minutes and resolved within 4 hours, with 99.95% uptime guaranteed under our Enterprise SLA.",
    confidence: 88,
    source: "enterprise_sla.pdf, Page 7",
  },
];

const PHASES = [
  "upload_kb",   // 0 — uploading PDFs
  "upload_rfp",  // 1 — uploading xlsx
  "processing",  // 2 — AI generating answers
  "review",      // 3 — table visible, approve rows
  "export",      // 4 — export flash
] as const;

type Phase = typeof PHASES[number];

const PHASE_DURATION: Record<Phase, number> = {
  upload_kb: 2000,
  upload_rfp: 1800,
  processing: 3500,
  review: 3500,
  export: 1500,
};

// ── Helpers ───────────────────────────────────────────────────
function useTypewriter(text: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, active]);
  return displayed;
}

function ConfidencePill({ score }: { score: number }) {
  const color = score > 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      {score}%
    </span>
  );
}

// ── Sub-scenes ────────────────────────────────────────────────
function UploadKB() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => {
      if (p >= 100) { clearInterval(t); setDone(true); return 100; }
      return p + 4;
    }), 60);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Database className="h-4 w-4 text-brand-600" /> Building Knowledge Base
      </div>
      {["security_policy.pdf", "soc2_report.pdf", "enterprise_sla.pdf"].map((f, i) => (
        <div key={f} className={`flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 transition-opacity duration-500 ${progress > i * 30 ? "opacity-100" : "opacity-0"}`}>
          <FileText className="h-4 w-4 shrink-0 text-brand-500" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-slate-700">{f}</p>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress - i * 30))}%` }}
              />
            </div>
          </div>
          {done && progress > i * 30 + 30 && (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
          )}
        </div>
      ))}
      {done && (
        <p className="text-center text-xs font-medium text-green-600">
          ✓ 3 documents · 847 chunks indexed
        </p>
      )}
    </div>
  );
}

function UploadRFP() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => {
      if (p >= 100) { clearInterval(t); return 100; }
      return p + 5;
    }), 50);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <FileText className="h-4 w-4 text-brand-600" /> Uploading RFP Workbook
      </div>
      <div className="w-full rounded-lg border-2 border-dashed border-brand-300 bg-brand-50 p-6 text-center">
        <FileText className="mx-auto mb-2 h-8 w-8 text-brand-400" />
        <p className="text-sm font-medium text-brand-700">vendor_rfp_2026.xlsx</p>
        <p className="text-xs text-brand-500">47 questions detected in Column A</p>
      </div>
      <div className="w-full">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Uploading…</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {progress === 100 && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
          <Zap className="h-3.5 w-3.5" /> Processing 47 questions via RAG…
        </div>
      )}
    </div>
  );
}

function ProcessingRow({ row, delay }: { row: typeof DEMO_ROWS[0]; delay: number }) {
  const [active, setActive] = useState(false);
  const text = useTypewriter(row.answer, active, 12);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-all duration-500 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      <p className="mb-1.5 text-xs font-semibold text-slate-500 truncate">{row.question}</p>
      <p className="min-h-[32px] text-xs leading-relaxed text-slate-700">
        {text}
        {active && text.length < row.answer.length && (
          <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-500" />
        )}
      </p>
    </div>
  );
}

function Processing() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Zap className="h-4 w-4 text-brand-600 animate-pulse" />
        AI generating answers…
      </div>
      {DEMO_ROWS.map((row, i) => (
        <ProcessingRow key={i} row={row} delay={i * 1100} />
      ))}
    </div>
  );
}

function Review() {
  const [approved, setApproved] = useState<Set<number>>(new Set());
  useEffect(() => {
    const timers = DEMO_ROWS.map((_, i) =>
      setTimeout(() => setApproved((s) => new Set([...s, i])), 600 + i * 700)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Review & Approve</span>
        <span className="text-xs text-slate-400">{approved.size}/3 approved</span>
      </div>
      {DEMO_ROWS.map((row, i) => (
        <div key={i} className={`flex items-start gap-2 rounded-lg border p-2.5 transition-all duration-500 ${approved.has(i) ? "border-green-200 bg-green-50" : "border-slate-100 bg-white"}`}>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[10px] font-medium text-slate-500">{row.question}</p>
            <p className="mt-0.5 truncate text-xs text-slate-700">{row.answer.slice(0, 60)}…</p>
            <p className="mt-1 text-[10px] text-slate-400">{row.source}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <ConfidencePill score={row.confidence} />
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${approved.has(i) ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
              {approved.has(i) ? <><CheckCircle className="h-2.5 w-2.5" /> Approved</> : "Approve"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Export() {
  const [downloaded, setDownloaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDownloaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500 ${downloaded ? "bg-green-100 scale-110" : "bg-brand-100"}`}>
        {downloaded
          ? <CheckCircle className="h-8 w-8 text-green-600" />
          : <Download className="h-8 w-8 text-brand-600 animate-bounce" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900">
          {downloaded ? "Export Complete!" : "Exporting…"}
        </p>
        <p className="text-xs text-slate-500">
          {downloaded
            ? "vendor_rfp_2026_veripitch_completed.xlsx"
            : "Injecting answers into Column B…"}
        </p>
      </div>
      {downloaded && (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-center">
          <p className="text-xs font-medium text-green-700">
            3/3 approved answers · Original formatting preserved
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
const PHASE_LABELS: Record<Phase, string> = {
  upload_kb:  "1. Build Knowledge Base",
  upload_rfp: "2. Upload RFP",
  processing: "3. AI Generates Answers",
  review:     "4. Human Review",
  export:     "5. Export",
};

export function AnimatedDemo() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = PHASES[phaseIndex];

  useEffect(() => {
    const t = setTimeout(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, PHASE_DURATION[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-yellow-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-400">
          app.veripitch.com/dashboard
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 border-b border-slate-100 bg-white px-4 py-2">
        {PHASES.map((p, i) => (
          <div key={p} className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i === phaseIndex ? "bg-brand-600 scale-125" : i < phaseIndex ? "bg-green-400" : "bg-slate-200"}`} />
            <span className={`text-[10px] font-medium transition-colors ${i === phaseIndex ? "text-brand-600" : "text-slate-300"}`}>
              {PHASE_LABELS[p].split(". ")[1]}
            </span>
            {i < PHASES.length - 1 && <span className="text-slate-200 text-[10px] mx-0.5">→</span>}
          </div>
        ))}
      </div>

      {/* Scene */}
      <div className="min-h-[280px] p-4">
        {phase === "upload_kb"  && <UploadKB />}
        {phase === "upload_rfp" && <UploadRFP />}
        {phase === "processing" && <Processing />}
        {phase === "review"     && <Review />}
        {phase === "export"     && <Export />}
      </div>
    </div>
  );
}
