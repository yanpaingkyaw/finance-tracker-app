import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { getBudget, getMonthlyReport, getTransactions } from "../api/services";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { SummaryCard } from "../components/SummaryCard";
import { useAuth } from "../hooks/useAuth";
import { formatMoney, fromIsoDate, todayYearMonth } from "../utils/format";

function formatShortMoney(valueMinor: number): string {
  const absolute = Math.abs(valueMinor);
  if (absolute >= 1000000) {
    return `${valueMinor < 0 ? "-" : ""}${Math.round(absolute / 100000) / 10}M`;
  }
  if (absolute >= 1000) {
    return `${valueMinor < 0 ? "-" : ""}${Math.round(absolute / 1000)}k`;
  }
  return `${valueMinor}`;
}

function categoryInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function DashboardPage() {
  const { token } = useAuth();
  const [yearMonth, setYearMonth] = useState(todayYearMonth());
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getBudget>>["budget"] | null>(null);
  const [reportMonth, setReportMonth] = useState<Awaited<ReturnType<typeof getMonthlyReport>>["report"]["months"][number] | null>(
    null,
  );
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getTransactions>>["transactions"]>([]);
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
        const [budgetRes, reportRes, transactionRes] = await Promise.all([
          getBudget(token, yearMonth),
          getMonthlyReport(token, yearMonth, yearMonth),
          getTransactions(token, yearMonth),
        ]);
        if (!cancelled) {
          setBudget(budgetRes.budget);
          setReportMonth(reportRes.report.months[0] ?? null);
          setTransactions(transactionRes.transactions);
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

  const healthLabel = useMemo(() => {
    if (!budget) {
      return "Good";
    }
    if (budget.summary.effectiveDeficitMinor > 0) {
      return "Action";
    }
    if (budget.summary.totalOverspentMinor > 0) {
      return "Watch";
    }
    return "Good";
  }, [budget]);

  const monthRemainingMinor = useMemo(() => {
    if (!budget) {
      return 0;
    }
    return budget.summary.totalRawRemainingMinor + budget.summary.carryoverRemainingMinor;
  }, [budget]);

  const budgetProgress = useMemo(() => {
    if (!budget || budget.summary.totalPlannedMinor <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((budget.summary.totalSpentMinor / budget.summary.totalPlannedMinor) * 100));
  }, [budget]);

  const attentionItems = useMemo(() => {
    if (!budget) {
      return [];
    }
    return [...budget.items]
      .filter((item) => item.plannedMinor > 0 || item.spentMinor > 0)
      .sort((a, b) => {
        const aOver = a.remainingMinor < 0 ? 1 : 0;
        const bOver = b.remainingMinor < 0 ? 1 : 0;
        if (aOver !== bOver) {
          return bOver - aOver;
        }
        const aRatio = a.plannedMinor === 0 ? 999 : a.spentMinor / a.plannedMinor;
        const bRatio = b.plannedMinor === 0 ? 999 : b.spentMinor / b.plannedMinor;
        return bRatio - aRatio;
      })
      .slice(0, 3);
  }, [budget]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [transactions]);

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
      <section className="mobile-command-center space-y-5 md:hidden">
        <section className="card-surface mobile-hero-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/75">Month remaining</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">{formatMoney(monthRemainingMinor)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-white/75">Health</p>
              <p className="font-display text-lg font-bold text-white">{healthLabel}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${budgetProgress}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-white/70">{budgetProgress}% of planned budget used</p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="card-surface p-4">
            <p className="text-sm font-semibold text-brand-600">Planned</p>
            <p className="mt-1 font-display text-lg font-bold text-brand-900">
              {formatMoney(budget.summary.totalPlannedMinor)}
            </p>
          </div>
          <div className="card-surface p-4">
            <p className="text-sm font-semibold text-brand-600">Spent</p>
            <p className="mt-1 font-display text-lg font-bold text-brand-900">
              {formatMoney(budget.summary.totalSpentMinor)}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link className="mobile-primary-action" to="/transactions">
            + Transaction
          </Link>
          <Link className="mobile-secondary-action" to="/budgets">
            Edit Budget
          </Link>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-brand-900">Needs attention</h2>
            <span className="text-xs font-semibold text-brand-600">{attentionItems.length} categories</span>
          </div>
          <div className="space-y-3">
            {attentionItems.map((item) => {
              const ratio = item.plannedMinor === 0 ? 100 : Math.round((item.spentMinor / item.plannedMinor) * 100);
              return (
                <Link className="mobile-list-card" to="/budgets" key={item.categoryId}>
                  <span className="mobile-list-icon">{categoryInitial(item.categoryName)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-brand-900">{item.categoryName}</span>
                    <span className="text-xs font-semibold text-brand-600">{ratio}% used this month</span>
                  </span>
                  <span className={`font-bold ${item.remainingMinor < 0 ? "text-red-700" : "text-brand-900"}`}>
                    {formatShortMoney(item.remainingMinor)}
                  </span>
                </Link>
              );
            })}
            {attentionItems.length === 0 ? (
              <div className="card-surface p-4 text-sm font-semibold text-brand-600">No category needs attention.</div>
            ) : null}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-brand-900">Recent transactions</h2>
            <Link className="text-xs font-semibold text-brand-600" to="/transactions">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <Link className="mobile-list-card" to="/transactions" key={tx.id}>
                <span className="mobile-list-icon">{categoryInitial(tx.categoryName)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-brand-900">{tx.categoryName}</span>
                  <span className="text-xs font-semibold text-brand-600">
                    {fromIsoDate(tx.date)} - {tx.note ?? tx.type}
                  </span>
                </span>
                <span className={`font-bold ${tx.type === "EXPENSE" ? "text-red-700" : "text-brand-700"}`}>
                  {formatShortMoney(tx.amountMinor)}
                </span>
              </Link>
            ))}
            {recentTransactions.length === 0 ? (
              <div className="card-surface p-4 text-sm font-semibold text-brand-600">
                No transactions for this month yet.
              </div>
            ) : null}
          </div>
        </section>

        <Link className="mobile-fab" to="/transactions" aria-label="Add transaction">
          +
        </Link>
      </section>

      <section className="card-surface hidden p-4 md:block">
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

      <section className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Planned" amountMinor={budget.summary.totalPlannedMinor} />
        <SummaryCard label="Total Spent" amountMinor={budget.summary.totalSpentMinor} />
        <SummaryCard label="Carryover Pool" amountMinor={budget.summary.carryoverPoolMinor} />
        <SummaryCard
          label="Effective Deficit"
          amountMinor={budget.summary.effectiveDeficitMinor}
          hint={budget.summary.effectiveDeficitMinor > 0 ? "Action needed" : "Under control"}
        />
      </section>

      <section className="card-surface hidden p-4 md:block">
        <p className="text-sm font-semibold text-brand-700">Budget health</p>
        <p className="mt-2 text-sm text-brand-600">{warning}</p>
      </section>

      <section className="card-surface hidden overflow-x-auto md:block">
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
        <section className="hidden gap-4 md:grid md:grid-cols-3">
          <SummaryCard label="Income (Month)" amountMinor={reportMonth.incomeMinor} />
          <SummaryCard label="Expense (Month)" amountMinor={reportMonth.expenseMinor} />
          <SummaryCard label="Net (Month)" amountMinor={reportMonth.netMinor} />
        </section>
      ) : null}
    </div>
  );
}
