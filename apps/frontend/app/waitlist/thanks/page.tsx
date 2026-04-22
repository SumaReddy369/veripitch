import Link from "next/link";

interface Props {
  searchParams: Promise<{ name?: string }>;
}

export default async function ThankYouPage({ searchParams }: Props) {
  const { name } = await searchParams;
  const firstName = name ? name.split(" ")[0] : "there";

  return (
    <div className="flex min-h-screen flex-col bg-blue-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-blue-200 bg-white px-8 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-900">VeriPitch</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
            {/* Blue top strip */}
            <div className="bg-blue-600 px-8 py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                You&apos;re on the list, {firstName}!
              </h1>
            </div>

            {/* Body */}
            <div className="px-8 py-8">
              <p className="mb-8 text-center text-slate-500">
                We&apos;re onboarding teams in waves. When your spot opens up,
                you&apos;ll receive a direct email with your personal access link.
              </p>

              {/* Steps */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
                  What happens next
                </p>
                <div className="flex flex-col gap-4">
                  {[
                    { step: "01", text: "Your name and email are saved to our waitlist." },
                    { step: "02", text: "We review requests and open access in batches." },
                    { step: "03", text: "You receive a personal invite link via email." },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                        {item.step}
                      </span>
                      <p className="text-sm text-slate-600">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/"
                  className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
                >
                  ← Back to homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
