"use client";

import { useRef, useState } from "react";
import { Database, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { deleteDocument, uploadDocument } from "@/lib/api";
import type { IngestedDocument } from "@/lib/types";

interface Props {
  documents: IngestedDocument[];
  totalChunks: number;
  loading: boolean;
  onUploaded: () => void;
  onDeleted: () => void;
}

export function KnowledgeBasePanel({
  documents,
  totalChunks,
  loading,
  onUploaded,
  onDeleted,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only .pdf files are accepted.");
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    setUploadError(null);

    try {
      const existing = documents.find((d) => d.filename === file.name);
      const res = await uploadDocument(file, !!existing);
      setUploadMsg(
        `✓ ${res.filename} ingested — ${res.chunks_created} chunks across ${res.pages_processed} pages`,
      );
      onUploaded();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename);
    try {
      await deleteDocument(filename);
      onDeleted();
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-semibold text-slate-900">Knowledge Base</h2>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Upload PDFs — answers are generated from these documents only.
        </p>
      </div>

      {/* Upload zone */}
      <div className="p-4">
        <label
          className={`upload-zone block transition-colors ${isDragging ? "upload-zone-active" : ""}`}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          {uploading ? (
            <Loader2 className="mb-2 h-7 w-7 animate-spin text-brand-500" />
          ) : (
            <UploadCloud className="mb-2 h-7 w-7 text-slate-400" />
          )}
          <p className="text-xs font-medium text-slate-600">
            {uploading ? "Ingesting document…" : "Drop PDF or click to upload"}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">Max 20 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>

        {uploadMsg && (
          <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
            {uploadMsg}
          </p>
        )}
        {uploadError && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {uploadError}
          </p>
        )}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ingested Documents
          </h3>
          {totalChunks > 0 && (
            <span className="text-[10px] text-slate-400">
              {totalChunks} total chunks
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading…
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" />
            <p className="text-xs text-slate-400">No documents yet</p>
            <p className="text-[10px] text-slate-300">Upload a PDF to begin</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {documents.map((doc) => (
              <li
                key={doc.filename}
                className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 hover:bg-white"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-medium text-slate-800"
                    title={doc.filename}
                  >
                    {doc.filename}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {doc.chunks} chunks
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.filename)}
                  disabled={deletingFile === doc.filename}
                  className="shrink-0 rounded p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Remove document"
                >
                  {deletingFile === doc.filename ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
