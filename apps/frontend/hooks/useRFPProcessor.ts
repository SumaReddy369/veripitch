"use client";

import { useState } from "react";
import { exportRFP, processRFP, triggerDownload } from "@/lib/api";
import type { ApprovedAnswer, RFPResult, RowState } from "@/lib/types";

interface RFPProcessorState {
  file: File | null;
  filename: string;
  isProcessing: boolean;
  isExporting: boolean;
  results: RFPResult[];
  rowStates: Record<number, RowState>;
  error: string | null;
}

const INITIAL: RFPProcessorState = {
  file: null,
  filename: "",
  isProcessing: false,
  isExporting: false,
  results: [],
  rowStates: {},
  error: null,
};

export function useRFPProcessor() {
  const [state, setState] = useState<RFPProcessorState>(INITIAL);

  // ── File selection ────────────────────────────────────────
  const setFile = (file: File) =>
    setState((s) => ({ ...s, file, error: null }));

  // ── Process RFP ───────────────────────────────────────────
  const process = async () => {
    if (!state.file) return;

    setState((s) => ({ ...s, isProcessing: true, error: null }));

    try {
      const response = await processRFP(state.file);

      // Initialise row states — all pending, no edits
      const rowStates: Record<number, RowState> = {};
      for (const r of response.results) {
        rowStates[r.row_index] = { editedAnswer: null, approved: false };
      }

      setState((s) => ({
        ...s,
        isProcessing: false,
        results: response.results,
        rowStates,
        filename: response.filename,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isProcessing: false,
        error: err instanceof Error ? err.message : "Processing failed.",
      }));
    }
  };

  // ── Edit an answer ────────────────────────────────────────
  const updateAnswer = (rowIndex: number, answer: string) =>
    setState((s) => ({
      ...s,
      rowStates: {
        ...s.rowStates,
        [rowIndex]: { ...s.rowStates[rowIndex], editedAnswer: answer },
      },
    }));

  // ── Toggle approval ───────────────────────────────────────
  const toggleApproval = (rowIndex: number) =>
    setState((s) => ({
      ...s,
      rowStates: {
        ...s.rowStates,
        [rowIndex]: {
          ...s.rowStates[rowIndex],
          approved: !s.rowStates[rowIndex]?.approved,
        },
      },
    }));

  // ── Approve all rows ──────────────────────────────────────
  const approveAll = () =>
    setState((s) => {
      const rowStates = { ...s.rowStates };
      for (const key of Object.keys(rowStates)) {
        rowStates[Number(key)] = { ...rowStates[Number(key)], approved: true };
      }
      return { ...s, rowStates };
    });

  // ── Export approved rows ──────────────────────────────────
  const exportApproved = async () => {
    if (!state.file) return;

    const approvedAnswers: ApprovedAnswer[] = state.results
      .filter((r) => state.rowStates[r.row_index]?.approved)
      .map((r) => ({
        row_index: r.row_index,
        // Use edited answer if available, otherwise original
        answer: state.rowStates[r.row_index]?.editedAnswer ?? r.answer,
      }));

    if (approvedAnswers.length === 0) return;

    setState((s) => ({ ...s, isExporting: true, error: null }));

    try {
      const blob = await exportRFP(state.file, approvedAnswers);
      const baseName = state.filename.replace(/\.xlsx$/i, "");
      triggerDownload(blob, `${baseName}_veripitch_completed.xlsx`);
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Export failed.",
      }));
    } finally {
      setState((s) => ({ ...s, isExporting: false }));
    }
  };

  // ── Reset ─────────────────────────────────────────────────
  const reset = () => setState(INITIAL);

  return {
    ...state,
    setFile,
    process,
    updateAnswer,
    toggleApproval,
    approveAll,
    exportApproved,
    reset,
  };
}
