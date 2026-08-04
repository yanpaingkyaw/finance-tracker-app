import { formatMoney } from "../utils/format";

export type BudgetVsActualItem = {
  label: string;
  budgetMinor: number;
  actualMinor: number;
};

function formatAxisMoney(valueMinor: number): string {
  const absolute = Math.abs(valueMinor);
  if (absolute >= 1_000_000) {
    return `${valueMinor < 0 ? "-" : ""}${Math.round(absolute / 100_000) / 10}M`;
  }
  if (absolute >= 1_000) {
    return `${valueMinor < 0 ? "-" : ""}${Math.round(absolute / 1_000)}k`;
  }
  return `${valueMinor}`;
}

function barHeightPercent(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }
  return Math.max((value / maxValue) * 100, value > 0 ? 4 : 0);
}

export function BudgetVsActualChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: BudgetVsActualItem[];
}) {
  const maxValue = Math.max(...items.flatMap((item) => [item.budgetMinor, item.actualMinor]), 0);

  return (
    <section className="card-surface p-4" aria-label={title}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-brand-600">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-brand-700" aria-hidden="true">
          <span className="inline-flex items-center gap-2">
            <span className="chart-legend-swatch chart-legend-budget" />
            Budget
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="chart-legend-swatch chart-legend-actual" />
            Actual
          </span>
        </div>
      </div>

      {items.length === 0 || maxValue <= 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 px-4 py-8 text-center text-sm text-brand-600">
          No budget or transaction data for this range yet.
        </p>
      ) : (
        <div className="chart-scroll mt-5">
          <div
            className="chart-bars"
            style={{ minWidth: `${Math.max(items.length * 4.5, 16)}rem` }}
            role="img"
            aria-label={`${title}: budget versus actual amounts by group`}
          >
            {items.map((item) => {
              const budgetHeight = barHeightPercent(item.budgetMinor, maxValue);
              const actualHeight = barHeightPercent(item.actualMinor, maxValue);
              const overBudget = item.actualMinor > item.budgetMinor && item.budgetMinor > 0;

              return (
                <div key={item.label} className="chart-group">
                  <div className="chart-group-bars" aria-hidden="true">
                    <div className="chart-bar-track">
                      <div
                        className="chart-bar chart-bar-budget"
                        style={{ height: `${budgetHeight}%` }}
                        title={`Budget ${formatMoney(item.budgetMinor)}`}
                      />
                    </div>
                    <div className="chart-bar-track">
                      <div
                        className={`chart-bar chart-bar-actual ${overBudget ? "chart-bar-over" : ""}`}
                        style={{ height: `${actualHeight}%` }}
                        title={`Actual ${formatMoney(item.actualMinor)}`}
                      />
                    </div>
                  </div>
                  <p className="chart-group-label">{item.label}</p>
                  <div className="chart-group-values">
                    <span className="text-brand-600">{formatAxisMoney(item.budgetMinor)}</span>
                    <span className={overBudget ? "text-rose-700" : "text-brand-800"}>
                      {formatAxisMoney(item.actualMinor)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
