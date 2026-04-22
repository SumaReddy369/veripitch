// ── Knowledge Base ────────────────────────────────────────────────────────────

export interface UploadResponse {
  message: string;
  filename: string;
  pages_processed: number;
  chunks_created: number;
}

export interface IngestedDocument {
  filename: string;
  chunks: number;
}

export interface DocumentListResponse {
  documents: IngestedDocument[];
  total_chunks: number;
}

// ── RFP Processing ────────────────────────────────────────────────────────────

export type RFPStatus = "pending" | "approved" | "rejected";

export interface RFPResult {
  row_index: number;
  question: string;
  answer: string;
  confidence_score: number;   // 0-100
  source_citation: string;
  status: RFPStatus;
}

export interface ProcessRFPResponse {
  job_id: string;
  filename: string;
  total_questions: number;
  results: RFPResult[];
}

// ── Export ────────────────────────────────────────────────────────────────────

export interface ApprovedAnswer {
  row_index: number;
  answer: string;
}

// ── UI State ──────────────────────────────────────────────────────────────────

export interface RowState {
  editedAnswer: string | null;   // null = unmodified (use original)
  approved: boolean;
}
