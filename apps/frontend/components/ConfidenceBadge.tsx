interface ConfidenceBadgeProps {
  score: number; // 0-100
}

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const { bg, text, ring, label } = getStyle(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${bg} ${text} ${ring}`}
      >
        {score}%
      </span>
      {/* Mini progress bar */}
      <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${bar(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium ${text}`}>{label}</span>
    </div>
  );
}

function getStyle(score: number) {
  if (score > 80) {
    return {
      bg: "bg-green-50",
      text: "text-green-700",
      ring: "ring-green-200",
      label: "High",
    };
  }
  if (score >= 50) {
    return {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      ring: "ring-yellow-200",
      label: "Medium",
    };
  }
  return {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    label: score === 0 ? "Not Found" : "Low",
  };
}

function bar(score: number) {
  if (score > 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}
