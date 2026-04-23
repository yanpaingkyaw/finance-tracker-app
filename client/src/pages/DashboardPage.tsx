import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/client";
import { getBudget, getMonthlyReport } from "../api/services";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { SummaryCard } from "../components/SummaryCard";
import { useAuth } from "../hooks/useAuth";
import { formatMoney, todayYearMonth } from "../utils/format";

export function DashboardPage() {
  const { token } = useAuth();
  const [yearMonth, setYearMonth] = useState(todayYearMonth());
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getBudget>>["budget"] | null>(null);
  const [reportMonth, setReportMonth] = useState<Awaited<ReturnType<typeof getMonthlyReport>>["report"]["months"][number] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const [budgetRes, reportRes] = await Promise.all([
          getBudget(token, yearMonth),
          getMonthlyReport(token, yearMonth, yearMonth),
        ]);
        if (!cancelled) {
          setBudget(budgetRes.budget);
          setReportMonth(reportRes.report.months[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Unable to load dashboard.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, yearMonth]);

  const warning = useMemo(() => {
    if (!budget) {
      return "";
    }
    if (budget.summary.effectiveDeficitMinor > 0) {
      return "Warning: Monthly spending exceeded budget and carryover pool.";
    }
    if (budget.summary.totalOverspentMinor > 0) {
      return "Overspending detected, but carryover pool covered it this month.";
    }
    return "Healthy budget month so far.";
  }, [budget]);

  if (loading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorNotice message={error} />;
  }

  if (!budget) {
    return <ErrorNotice message="No budget data available." />;
  }

  return (
    <div className="space-y-6">
      <section className="card-surface p-4">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-brand-700">Budget month</span>
          <input
            className="field max-w-xs"
            type="month"
            value={yearMonth}
            onChange={(event) => setYearMonth(event.target.value)}
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Planned" amountMinor={budget.summary.totalPlannedMinor} />
        <SummaryCard label="Total Spent" amountMinor={budget.summary.totalSpentMinor} />
        <SummaryCard label="Carryover Pool" amountMinor={budget.summary.carryoverPoolMinor} />
        <SummaryCard
          label="Effective Deficit"
          amountMinor={budget.summary.effectiveDeficitMinor}
          hint={budget.summary.effectiveDeficitMinor > 0 ? "Action needed" : "Under control"}
        />
      </section>

      <section className="card-surface p-4">
        <p className="text-sm font-semibold text-brand-700">Budget health</p>
        <p className="mt-2 text-sm text-brand-600">{warning}</p>
      </section>

      <section className="card-surface overflow-x-auto">
        <table className="data-table min-w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Planned</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item) => {
              const ratio = item.plannedMinor === 0 ? 0 : Math.min(1.2, item.spentMinor / item.plannedMinor);
              const percent = Math.round(ratio * 100);
              const over = item.remainingMinor < 0;
              return (
                <tr key={item.categoryId}>
                  <td className="px-4 py-3">{item.categoryName}</td>
                  <td className="px-4 py-3">{formatMoney(item.plannedMinor)}</td>
                  <td className="px-4 py-3">{formatMoney(item.spentMinor)}</td>
                  <td className={`px-4 py-3 font-semibold ${over ? "text-red-700" : "text-brand-700"}`}>
                    {formatMoney(item.remainingMinor)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full rounded-full bg-brand-100/70">
                      <div
                        className={`h-2 rounded-full ${over ? "bg-red-500" : "bg-brand-500"}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-brand-500">{percent}%</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {reportMonth ? (
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Income (Month)" amountMinor={reportMonth.incomeMinor} />
          <SummaryCard label="Expense (Month)" amountMinor={reportMonth.expenseMinor} />
          <SummaryCard label="Net (Month)" amountMinor={reportMonth.netMinor} />
        </section>
      ) : null}
    </div>
  );
}
