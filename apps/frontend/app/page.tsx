import Link from "next/link";
import { Bot, CheckCircle, FileText, Shield, Zap, Database, Clock } from "lucide-react";
import { AnimatedDemo } from "@/components/AnimatedDemo";
import { WaitlistForm } from "@/components/WaitlistForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">VeriPitch</span>
            <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
              Beta
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Try the demo →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-6 pb-16 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative mx-auto max-w-6xl">
          {/* Two-column layout: text left, demo right */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">

            {/* Left — copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
                <Zap className="h-3.5 w-3.5" />
                AI · Source-Attributed · Human-Reviewed
              </div>

              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-5xl">
                Complete RFPs{" "}
                <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
                  10× faster
                </span>{" "}
                with AI
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-slate-500">
                Upload your security policies, product docs, and compliance certs once.
                VeriPitch answers every RFP question with exact source citations and
                confidence scores — in minutes, not days.
              </p>

              {/* Waitlist form */}
              <div className="flex flex-col items-center gap-3 lg:items-start">
                <WaitlistForm />
                <p className="text-xs text-slate-400">
                  No credit card required · Early access launching soon
                </p>
              </div>

              {/* Social proof stats */}
              <div className="mt-10 flex flex-wrap justify-center gap-8 lg:justify-start">
                {[
                  { value: "4+ hrs", label: "saved per RFP" },
                  { value: "< 3 min", label: "for 50 questions" },
                  { value: "100%", label: "source-backed answers" },
                ].map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — animated demo */}
            <div className="w-full max-w-lg shrink-0 lg:w-[480px]">
              <div className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live product demo ↓
              </div>
              <AnimatedDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-slate-900">
            From upload to export in 4 steps
          </h2>
          <p className="mb-12 text-center text-slate-500">
            No training required. Works with any RFP format.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              { step: "01", icon: Database, title: "Upload your docs", desc: "PDFs only. Security policies, product specs, compliance certs — anything your team uses to answer RFPs." },
              { step: "02", icon: FileText, title: "Drop in the RFP", desc: "Upload the client's .xlsx workbook. Questions are extracted from Column A automatically." },
              { step: "03", icon: Bot, title: "AI answers everything", desc: "RAG retrieves the most relevant context. Llama 3 answers with citations. Confidence scored 0–100." },
              { step: "04", icon: CheckCircle, title: "Review and export", desc: "Edit any answer inline, approve row by row, then export the completed .xlsx with one click." },
            ].map((item) => (
              <div key={item.step} className="card p-6">
                <div className="mb-3 text-xs font-bold tracking-widest text-brand-500">STEP {item.step}</div>
                <item.icon className="mb-3 h-6 w-6 text-brand-600" />
                <h3 className="mb-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Built for enterprise sales teams
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: "Source attribution", desc: "Every answer cites the exact document and page number. Auditable, trustworthy, defensible." },
              { icon: Zap,    title: "Confidence scoring", desc: "Green / Yellow / Red scoring shows exactly where human review is needed." },
              { icon: CheckCircle, title: "Human-in-the-loop", desc: "Edit any answer inline. Only approved rows go into the final export." },
              { icon: FileText,   title: "Exact-format export", desc: "Answers injected into Column B of the original .xlsx. Macros, merges, and styles preserved." },
              { icon: Database,   title: "Persistent knowledge base", desc: "Upload your docs once. Indexed and ready for every future RFP — no re-uploading." },
              { icon: Clock,      title: "Works on any RFP", desc: "Security, compliance, technical, procurement — if it has questions, VeriPitch can answer it." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-100 p-6 hover:border-brand-200 hover:shadow-sm transition-all">
                <f.icon className="mb-3 h-5 w-5 text-brand-600" />
                <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-600 to-indigo-600 px-6 py-20 text-center">
        <h2 className="mb-3 text-3xl font-bold text-white">
          Be first in line
        </h2>
        <p className="mb-8 text-brand-100">
          We're onboarding a select group of enterprise sales teams in our private beta.
        </p>
        <div className="flex justify-center">
          <WaitlistForm />
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-brand-600">
            <Bot className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium text-slate-600">VeriPitch</span>
        </div>
        <p>© 2026 VeriPitch. Autonomous RFP Completion Agent.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-xs text-slate-300 hover:text-slate-500">
          Try the live demo →
        </Link>
      </footer>
    </div>
  );
}
