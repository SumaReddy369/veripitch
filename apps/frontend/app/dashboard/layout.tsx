import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-blue-50">
      {/* ── Top nav ──────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-blue-200 bg-white px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-slate-900">VeriPitch</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
            Beta
          </span>
        </Link>

        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* ── Page content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
