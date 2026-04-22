"use client";

import { useRef } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import type { RFPResult, RowState } from "@/lib/types";

interface Props {
  results: RFPResult[];
  rowStates: Record<number, RowState>;
  onAnswerChange: (rowIndex: number, answer: string) => void;
  onToggleApproval: (rowIndex: number) => void;
}

export function ReviewTable({
  results,
  rowStates,
  onAnswerChange,
  onToggleApproval,
}: Props) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="sticky top-0 z-10 bg-slate-50 shadow-sm">
          <th className="table-header w-10 text-center">#</th>
          <th className="table-header w-1/4">Question</th>
          <th className="table-header">AI Answer</th>
          <th className="table-header w-28 text-center">Confidence</th>
          <th className="table-header w-44">Source</th>
          <th className="table-header w-28 text-center">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {results.map((row, i) => (
          <ReviewRow
            key={row.row_index}
            index={i + 1}
            result={row}
            state={rowStates[row.row_index] ?? { editedAnswer: null, approved: false }}
            onAnswerChange={onAnswerChange}
            onToggleApproval={onToggleApproval}
          />
        ))}
      </tbody>
    </table>
  );
}

// ── Single Row ────────────────────────────────────────────────────────────────

interface RowProps {
  index: number;
  result: RFPResult;
  state: RowState;
  onAnswerChange: (rowIndex: number, answer: string) => void;
  onToggleApproval: (rowIndex: number) => void;
}

function ReviewRow({ index, result, state, onAnswerChange, onToggleApproval }: RowProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isModified = state.editedAnswer !== null && state.editedAnswer !== result.answer;
  const displayAnswer = state.editedAnswer ?? result.answer;
  const isNotFound = result.answer.startsWith("Information not found");

  return (
    <tr
      className={`transition-colors ${
        state.approved
          ? "bg-green-50/40"
          : isNotFound
            ? "bg-red-50/30"
            : "hover:bg-slate-50/50"
      }`}
    >
      {/* Row number */}
      <td className="table-cell w-10 text-center font-mono text-xs text-slate-400">
        {index}
      </td>

      {/* Question */}
      <td className="table-cell w-1/4 align-top">
        <p className="text-xs leading-relaxed text-slate-700">{result.question}</p>
      </td>

      {/* AI Answer (editable) */}
      <td className="table-cell align-top">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={displayAnswer}
            onChange={(e) => onAnswerChange(result.row_index, e.target.value)}
            className={`w-full resize-none rounded-lg border px-3 py-2 text-xs leading-relaxed text-slate-800 outline-none transition-colors focus:ring-2 focus:ring-brand-500 ${
              isModified
                ? "border-brand-300 bg-brand-50/50"
                : "border-slate-200 bg-transparent hover:border-slate-300 focus:bg-white"
            } ${isNotFound ? "text-slate-400" : ""}`}
          />
          {/* Modified indicator + reset */}
          {isModified && (
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-700">
                Edited
              </span>
              <button
                onClick={() => onAnswerChange(result.row_index, result.answer)}
                title="Reset to original"
                className="rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </td>

      {/* Confidence */}
      <td className="table-cell w-28 text-center align-top">
        <div className="flex justify-center pt-1">
          <ConfidenceBadge score={result.confidence_score} />
        </div>
      </td>

      {/* Source */}
      <td className="table-cell w-44 align-top">
        <p className="text-xs text-slate-500 leading-relaxed">
          {result.source_citation === "N/A" ? (
            <span className="text-slate-300">—</span>
          ) : (
            result.source_citation
          )}
        </p>
      </td>

      {/* Status toggle */}
      <td className="table-cell w-28 text-center align-top">
        <button
          onClick={() => onToggleApproval(result.row_index)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
            state.approved
              ? "bg-green-100 text-green-700 ring-1 ring-green-300 hover:bg-green-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {state.approved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Approved
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5 opacity-40" />
              Approve
            </>
          )}
        </button>
      </td>
    </tr>
  );
}
