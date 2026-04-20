import { FormEvent, useState } from "react";
import { ApiError } from "../api/client";
import { getMonthlyReport } from "../api/services";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { formatMoney, todayYearMonth } from "../utils/format";

export function ReportsPage() {
  const { token } = useAuth();
  const [from, setFrom] = useState(todayYearMonth());
  const [to, setTo] = useState(todayYearMonth());
  const [report, setReport] = useState<Awaited<ReturnType<typeof getMonthlyReport>>["report"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await getMonthlyReport(token, from, to);
      setReport(response.report);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load report.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card-surface p-4">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleRun}>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">From</span>
            <input className="field" type="month" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">To</span>
            <input className="field" type="month" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <div className="flex items-end">
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Running..." : "Run Monthly Report"}
            </button>
          </div>
        </form>
      </section>

      {error ? <ErrorNotice message={error} /> : null}
      {loading ? <LoadingState label="Loading report..." /> : null}

      {report ? (
        <>
          <section className="card-surface overflow-x-auto">
            <h2 className="px-4 pt-4 font-display text-lg font-bold text-brand-900">Monthly Summary</h2>
            <table className="min-w-full text-sm">
              <thead className="bg-brand-100 text-left text-brand-700">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Income</th>
                  <th className="px-4 py-3">Expense</th>
                  <th className="px-4 py-3">Net</th>
                  <th className="px-4 py-3">Planned</th>
                  <th className="px-4 py-3">Spent (Budget)</th>
                  <th className="px-4 py-3">Deficit</th>
                </tr>
              </thead>
              <tbody>
                {report.months.map((month) => (
                  <tr key={month.yearMonth} className="border-t border-brand-100">
                    <td className="px-4 py-3">{month.yearMonth}</td>
                    <td className="px-4 py-3">{formatMoney(month.incomeMinor)}</td>
                    <td className="px-4 py-3">{formatMoney(month.expenseMinor)}</td>
                    <td className="px-4 py-3">{formatMoney(month.netMinor)}</td>
                    <td className="px-4 py-3">{formatMoney(month.totalPlannedMinor)}</td>
                    <td className="px-4 py-3">{formatMoney(month.totalSpentMinor)}</td>
                    <td className={`px-4 py-3 ${month.effectiveDeficitMinor > 0 ? "text-red-700" : "text-brand-700"}`}>
                      {formatMoney(month.effectiveDeficitMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card-surface overflow-x-auto">
            <h2 className="px-4 pt-4 font-display text-lg font-bold text-brand-900">Category Totals</h2>
            <table className="min-w-full text-sm">
              <thead className="bg-brand-100 text-left text-brand-700">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Planned</th>
                  <th className="px-4 py-3">Spent</th>
                  <th className="px-4 py-3">Variance</th>
                </tr>
              </thead>
              <tbody>
                {report.categoryTotals.map((entry) => {
                  const variance = entry.plannedMinor - entry.spentMinor;
                  return (
                    <tr key={entry.categoryId} className="border-t border-brand-100">
                      <td className="px-4 py-3">{entry.categoryName}</td>
                      <td className="px-4 py-3">{formatMoney(entry.plannedMinor)}</td>
                      <td className="px-4 py-3">{formatMoney(entry.spentMinor)}</td>
                      <td className={`px-4 py-3 ${variance < 0 ? "text-red-700" : "text-brand-700"}`}>
                        {formatMoney(variance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
