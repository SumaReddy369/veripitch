import Link from "next/link";
import { Bot } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* ── Top nav ──────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">VeriPitch</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
            Beta
          </span>
        </Link>

        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* ── Page content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
