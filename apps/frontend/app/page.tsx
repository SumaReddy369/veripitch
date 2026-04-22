import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Zap, FileText, Database } from "lucide-react";
import { AnimatedDemo } from "@/components/AnimatedDemo";
import { WaitlistForm } from "@/components/WaitlistForm";

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-6xl px-6 ${className}`}>
      {children}
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-blue-50 font-sans antialiased">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-blue-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-900">VeriPitch</span>
          </div>
          <a
            href="#waitlist"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Request Early Access
          </a>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-600">
        <Section className="py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-400/40 bg-blue-500/30 px-4 py-1.5 text-sm text-blue-100">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Private beta · Limited spots available
            </div>

            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-white lg:text-6xl">
              Answer vendor questionnaires{" "}
              <span className="text-blue-200">10× faster</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-blue-100">
              VeriPitch reads your security policies, compliance reports, and product docs,
              then fills every RFP question with cited answers and confidence scores —
              automatically. Review in minutes. Export in one click.
            </p>

            <div id="waitlist" className="flex justify-center">
              <WaitlistForm dark />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-blue-200">
              {["No credit card required", "Invite-only access", "GDPR compliant"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* Product demo — bottom of hero strip */}
        <div className="pb-24">
          <Section>
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-blue-300">
              Live product demo
            </p>
            <AnimatedDemo />
          </Section>
        </div>
      </div>

      {/* ── TRUST BAR ───────────────────────────────────────── */}
      <div className="border-y border-blue-200 bg-white py-10">
        <Section>
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-blue-400">
            Designed for teams that answer security questionnaires at scale
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {["Security Reviews", "SOC 2 Questionnaires", "CAIQ Assessments", "Vendor Due Diligence", "Procurement RFPs"].map((label) => (
              <span key={label} className="text-sm font-semibold text-slate-400">{label}</span>
            ))}
          </div>
        </Section>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <div className="bg-blue-50 py-24">
        <Section>
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              From upload to completed RFP in four steps
            </h2>
            <p className="mt-3 text-slate-500">No configuration. No training data. Works on any format.</p>
          </div>

          <div className="grid grid-cols-1 gap-0 md:grid-cols-4">
            {[
              { n: "01", title: "Build your knowledge base", desc: "Upload your security policies, product specs, and compliance certs once. VeriPitch chunks and indexes everything.", icon: Database },
              { n: "02", title: "Drop in the RFP",            desc: "Upload the client's Excel workbook. Questions are parsed from Column A automatically — no template required.", icon: FileText },
              { n: "03", title: "AI answers every question",  desc: "Retrieval-augmented generation finds the right context for each question and writes a cited, confidence-scored answer.", icon: Zap },
              { n: "04", title: "Review, approve, export",    desc: "Edit any answer inline. Approve row by row. Export the completed Excel file — original formatting preserved.", icon: CheckCircle },
            ].map((step) => (
              <div key={step.n} className="flex flex-col rounded-xl bg-white p-8 ring-1 ring-blue-100 m-2 shadow-sm">
                <div className="mb-4 text-xs font-bold tracking-widest text-blue-500">{step.n}</div>
                <step.icon className="mb-4 h-6 w-6 text-blue-600" />
                <h3 className="mb-2 text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── FEATURES — two-column split ─────────────────────── */}
      <div className="bg-white py-24">
        <Section>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left */}
            <div>
              <h2 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
                Every answer is cited, scored, and auditable.
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-500">
                We built VeriPitch for the sales engineers who spend days every quarter
                manually searching through docs to fill the same questionnaire fields.
                Now that's a 4-minute job.
              </p>
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Request early access <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Right — feature tiles */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Shield,       title: "Source attribution on every answer", desc: "Each answer cites the exact document name and page number it came from. Auditable and defensible." },
                { icon: Zap,          title: "Confidence scoring",                 desc: "Answers are scored 0–100. Low-confidence rows are flagged for human attention before export." },
                { icon: CheckCircle,  title: "Human-in-the-loop review",           desc: "Edit any answer inline. Only rows you approve are included in the final export." },
                { icon: FileText,     title: "Exact-format Excel export",          desc: "Answers are injected into Column B of the original workbook. Merges, styles, and macros preserved." },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                    <f.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-slate-900">{f.title}</p>
                    <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ── STATS BAND ──────────────────────────────────────── */}
      <div className="bg-blue-600 py-20">
        <Section>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-blue-500 md:grid-cols-4">
            {[
              { value: "< 4 min",  label: "to process a 50-question RFP" },
              { value: "90%+",     label: "average confidence score" },
              { value: "100%",     label: "source-attributed answers" },
              { value: "1-click",  label: "Excel export, original format" },
            ].map((s) => (
              <div key={s.label} className="bg-blue-600 px-8 py-10 text-center">
                <div className="mb-1 text-3xl font-extrabold tracking-tight text-white">{s.value}</div>
                <div className="text-sm text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <div className="bg-blue-50 py-24">
        <Section>
          <div className="mx-auto max-w-xl rounded-2xl border border-blue-200 bg-white px-10 py-14 text-center shadow-sm">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">
              Join the private beta
            </h2>
            <p className="mb-8 text-slate-500">
              We're onboarding a select group of enterprise sales teams.
              Get early access before we open to the public.
            </p>
            <div className="flex justify-center">
              <WaitlistForm />
            </div>
          </div>
        </Section>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-blue-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
              <svg viewBox="0 0 20 20" fill="white" className="h-3.5 w-3.5">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">VeriPitch</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 VeriPitch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
