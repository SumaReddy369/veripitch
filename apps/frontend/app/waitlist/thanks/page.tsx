import Link from "next/link";
import { Bot, CheckCircle, Mail } from "lucide-react";

interface Props {
  searchParams: Promise<{ name?: string }>;
}

export default async function ThankYouPage({ searchParams }: Props) {
  const { name } = await searchParams;
  const firstName = name ? name.split(" ")[0] : "there";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6">
      {/* Logo */}
      <Link href="/" className="mb-10 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">VeriPitch</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          You&apos;re on the list, {firstName}!
        </h1>
        <p className="mb-6 text-slate-500">
          Thanks for your interest in VeriPitch. We&apos;re onboarding a select
          group of early users — we&apos;ll reach out to you directly when your
          spot is ready.
        </p>

        {/* What to expect */}
        <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            What happens next
          </p>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <p className="text-sm text-slate-600">
              We&apos;ll send you an invite email with your personal access link
              as soon as your spot opens up.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
