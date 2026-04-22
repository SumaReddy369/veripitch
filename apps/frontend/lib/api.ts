import type {
  ApprovedAnswer,
  DocumentListResponse,
  ProcessRFPResponse,
  UploadResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Generic fetch wrapper ─────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ── Knowledge Base ─────────────────────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  replace = false,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadResponse>(
    `/api/v1/knowledge-base/upload${replace ? "?replace=true" : ""}`,
    { method: "POST", body: form },
  );
}

export async function listDocuments(): Promise<DocumentListResponse> {
  return request<DocumentListResponse>("/api/v1/knowledge-base/");
}

export async function deleteDocument(filename: string): Promise<void> {
  await fetch(`${BASE}/api/v1/knowledge-base/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
}

// ── RFP Processing ─────────────────────────────────────────────────────────────

export async function processRFP(file: File): Promise<ProcessRFPResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<ProcessRFPResponse>("/api/v1/rfp/process", {
    method: "POST",
    body: form,
  });
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportRFP(
  originalFile: File,
  answers: ApprovedAnswer[],
): Promise<Blob> {
  const form = new FormData();
  form.append("file", originalFile);
  form.append("answers", JSON.stringify(answers));

  const res = await fetch(`${BASE}/api/v1/rfp/export`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = `Export failed (HTTP ${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  return res.blob();
}

// ── Browser download helper ────────────────────────────────────────────────────

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
