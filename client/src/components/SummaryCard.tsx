import { formatMoney } from "../utils/format";

export function SummaryCard({
  label,
  amountMinor,
  hint,
}: {
  label: string;
  amountMinor: number;
  hint?: string;
}) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-2 text-2xl font-display font-bold text-brand-900">{formatMoney(amountMinor)}</p>
      {hint ? <p className="mt-1 text-xs text-brand-600">{hint}</p> : null}
    </div>
  );
}
