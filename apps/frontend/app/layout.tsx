import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeriPitch — Autonomous RFP Completion Agent",
  description:
    "AI-powered RFP completion from your internal knowledge base. High-accuracy answers with source attribution and confidence scores.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
