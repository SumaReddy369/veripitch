import Link from "next/link";

interface Props {
  searchParams: Promise<{ name?: string }>;
}

export default async function ThankYouPage({ searchParams }: Props) {
  const { name } = await searchParams;
  const firstName = name ? name.split(" ")[0] : "there";

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
            <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-base font-bold text-white">VeriPitch</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Check icon */}
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-white">
            You&apos;re on the list, {firstName}.
          </h1>
          <p className="mb-10 text-lg text-slate-400">
            We&apos;re onboarding teams in waves. When your spot opens up,
            you&apos;ll get a direct email with your personal access link.
          </p>

          {/* What to expect */}
          <div className="mb-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left">
            <div className="border-b border-white/10 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">What happens next</p>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { step: "01", text: "Your email and name are saved to our waitlist." },
                { step: "02", text: "We review requests and open access in batches." },
                { step: "03", text: "You receive a personal invite link — no self-signup needed." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 px-6 py-4">
                  <span className="mt-0.5 text-xs font-bold text-brand-400">{item.step}</span>
                  <p className="text-sm text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-300"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
