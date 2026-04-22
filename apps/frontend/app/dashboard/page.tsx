"use client";

import { useEffect, useState } from "react";
import { Database, FileText, Zap } from "lucide-react";
import { KnowledgeBasePanel } from "@/components/KnowledgeBasePanel";
import { ReviewTable } from "@/components/ReviewTable";
import { useRFPProcessor } from "@/hooks/useRFPProcessor";
import { listDocuments } from "@/lib/api";
import type { DocumentListResponse } from "@/lib/types";

export default function DashboardPage() {
  const rfp = useRFPProcessor();

  const [docList, setDocList] = useState<DocumentListResponse>({
    documents: [],
    total_chunks: 0,
  });
  const [docsLoading, setDocsLoading] = useState(true);

  const refreshDocs = async () => {
    try {
      const data = await listDocuments();
      setDocList(data);
    } catch {
      // Non-fatal — backend might be warming up
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    refreshDocs();
  }, []);

  const approvedCount = rfp.results.filter(
    (r) => rfp.rowStates[r.row_index]?.approved,
  ).length;

  const avgConfidence =
    rfp.results.length > 0
      ? Math.round(
          rfp.results.reduce((s, r) => s + r.confidence_score, 0) /
            rfp.results.length,
        )
      : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Toolbar (stats + export) ───────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-2.5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Database className="h-4 w-4" />
            <span>
              <span className="font-semibold text-slate-900">
                {docList.documents.length}
              </span>{" "}
              docs ·{" "}
              <span className="font-semibold text-slate-900">
                {docList.total_chunks}
              </span>{" "}
              chunks
            </span>
          </div>

          {rfp.results.length > 0 && avgConfidence !== null && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Zap className="h-4 w-4" />
              <span>
                Avg confidence:{" "}
                <span
                  className={`font-semibold ${
                    avgConfidence > 80
                      ? "text-green-600"
                      : avgConfidence >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {avgConfidence}%
                </span>
              </span>
            </div>
          )}
        </div>

        {rfp.results.length > 0 && (
          <button
            onClick={rfp.exportApproved}
            disabled={approvedCount === 0 || rfp.isExporting}
            className="btn-primary"
          >
            <FileText className="h-4 w-4" />
            {rfp.isExporting
              ? "Exporting…"
              : `Export Approved (${approvedCount}/${rfp.results.length})`}
          </button>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Knowledge Base */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <KnowledgeBasePanel
            documents={docList.documents}
            totalChunks={docList.total_chunks}
            loading={docsLoading}
            onUploaded={refreshDocs}
            onDeleted={refreshDocs}
          />
        </aside>

        {/* Main area — RFP Processor */}
        <main className="flex flex-1 flex-col overflow-hidden p-6">
          {rfp.results.length === 0 ? (
            <RFPUploadPanel rfp={rfp} hasDocuments={docList.documents.length > 0} />
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Review Answers
                  </h2>
                  <p className="text-sm text-slate-500">
                    {rfp.results.length} questions from{" "}
                    <span className="font-medium">{rfp.filename}</span> — edit
                    answers then approve rows before exporting.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={rfp.approveAll} className="btn-secondary">
                    Approve All
                  </button>
                  <button onClick={rfp.reset} className="btn-secondary">
                    Process New RFP
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <ReviewTable
                  results={rfp.results}
                  rowStates={rfp.rowStates}
                  onAnswerChange={rfp.updateAnswer}
                  onToggleApproval={rfp.toggleApproval}
                />
              </div>

              {rfp.error && (
                <p className="mt-2 text-sm text-red-600">{rfp.error}</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── RFP Upload Panel (shown before processing) ────────────────────────────────

function RFPUploadPanel({
  rfp,
  hasDocuments,
}: {
  rfp: ReturnType<typeof useRFPProcessor>;
  hasDocuments: boolean;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".xlsx")) rfp.setFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) rfp.setFile(file);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        {!hasDocuments && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-amber-800">
              Your knowledge base is empty. Upload at least one PDF in the left
              panel before processing an RFP.
            </p>
          </div>
        )}

        <div className="card p-8">
          <h2 className="mb-1 text-xl font-bold text-slate-900">
            Process an RFP
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Upload your RFP (.xlsx) — Column A must contain the questions.
          </p>

          <label
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="upload-zone mb-4 block"
          >
            <FileText className="mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              Drop your .xlsx file here
            </p>
            <p className="mt-1 text-xs text-slate-400">or click to browse</p>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleChange}
              className="sr-only"
            />
          </label>

          {rfp.file && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2.5">
              <FileText className="h-4 w-4 text-brand-600" />
              <span className="flex-1 truncate text-sm font-medium text-brand-800">
                {rfp.file.name}
              </span>
              <span className="text-xs text-brand-600">
                {(rfp.file.size / 1024).toFixed(0)} KB
              </span>
            </div>
          )}

          {rfp.error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {rfp.error}
            </p>
          )}

          <button
            onClick={rfp.process}
            disabled={!rfp.file || rfp.isProcessing || !hasDocuments}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {rfp.isProcessing ? (
              <>
                <Spinner />
                Processing questions via RAG…
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Process RFP
              </>
            )}
          </button>

          {rfp.isProcessing && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Generating embeddings and querying the knowledge base for each
              question. This takes ~1–2 s per question.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
