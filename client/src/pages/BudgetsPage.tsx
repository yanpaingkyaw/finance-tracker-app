import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/client";
import { closeMonth, getBudget, updateBudgetItems } from "../api/services";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { SummaryCard } from "../components/SummaryCard";
import { useAuth } from "../hooks/useAuth";
import { formatMoney, todayYearMonth } from "../utils/format";

export function BudgetsPage() {
  const { token } = useAuth();
  const [yearMonth, setYearMonth] = useState(todayYearMonth());
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getBudget>>["budget"] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await getBudget(token, yearMonth);
      setBudget(response.budget);
      setDraft(
        response.budget.items.reduce<Record<string, string>>((acc, item) => {
          acc[item.categoryId] = `${item.plannedMinor}`;
          return acc;
        }, {}),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load budget.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, yearMonth]);

  const draftTotal = useMemo(() => {
    return Object.values(draft).reduce((sum, value) => sum + (Number(value) || 0), 0);
  }, [draft]);

  async function saveBudget() {
    if (!token || !budget) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const items = budget.items.map((item) => ({
        categoryId: item.categoryId,
        plannedMinor: Number(draft[item.categoryId] || 0),
      }));
      const response = await updateBudgetItems(token, yearMonth, items);
      setBudget(response.budget);
      setDraft(
        response.budget.items.reduce<Record<string, string>>((acc, item) => {
          acc[item.categoryId] = `${item.plannedMinor}`;
          return acc;
        }, {}),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save budget.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function closeCurrentMonth() {
    if (!token) {
      return;
    }
    setError("");
    try {
      await closeMonth(token, yearMonth);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to close month.");
      }
    }
  }

  if (loading) {
    return <LoadingState label="Loading budgets..." />;
  }

  if (!budget) {
    return <ErrorNotice message="No budget data available." />;
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice message={error} /> : null}

      <section className="card-surface p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">Budget month</span>
            <input
              className="field"
              type="month"
              value={yearMonth}
              onChange={(event) => setYearMonth(event.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={closeCurrentMonth}>
              Close Month
            </button>
            <button className="btn-primary" onClick={saveBudget} disabled={saving}>
              {saving ? "Saving..." : "Save Budget Plan"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Current Planned" amountMinor={budget.summary.totalPlannedMinor} />
        <SummaryCard label="Draft Planned" amountMinor={draftTotal} />
        <SummaryCard label="Carryover Pool" amountMinor={budget.summary.carryoverPoolMinor} />
        <SummaryCard label="Pool Remaining" amountMinor={budget.summary.carryoverRemainingMinor} />
      </section>

      <section className="card-surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-100 text-left text-brand-700">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Planned (MMK)</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item) => {
              const remaining = Number(draft[item.categoryId] || 0) - item.spentMinor;
              const over = remaining < 0;
              return (
                <tr key={item.categoryId} className="border-t border-brand-100">
                  <td className="px-4 py-3">{item.categoryName}</td>
                  <td className="px-4 py-3">
                    <input
                      className="field max-w-[160px]"
                      type="number"
                      min={0}
                      step={1}
                      value={draft[item.categoryId] ?? "0"}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          [item.categoryId]: event.target.value,
                        }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3">{formatMoney(item.spentMinor)}</td>
                  <td className={`px-4 py-3 font-semibold ${over ? "text-red-700" : "text-brand-700"}`}>
                    {formatMoney(remaining)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
