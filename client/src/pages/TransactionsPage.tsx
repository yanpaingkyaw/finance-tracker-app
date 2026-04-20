import { FormEvent, useEffect, useMemo, useState } from "react";
import { CategoryDto } from "@mini-finance/shared";
import { ApiError } from "../api/client";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  updateTransaction,
} from "../api/services";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { formatMoney, fromIsoDate, toIsoDate, todayDateInputValue, todayYearMonth } from "../utils/format";

export function TransactionsPage() {
  const { token } = useAuth();
  const [yearMonth, setYearMonth] = useState(todayYearMonth());
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getTransactions>>["transactions"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    amountMinor: "",
    categoryId: "",
    date: todayDateInputValue(),
    note: "",
  });

  const categoryMap = useMemo(() => new Map(categories.map((cat) => [cat.id, cat])), [categories]);

  async function load() {
    if (!token) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [categoryRes, txRes] = await Promise.all([getCategories(token), getTransactions(token, yearMonth)]);
      setCategories(categoryRes.categories);
      setTransactions(txRes.transactions);
      if (!form.categoryId) {
        const first = categoryRes.categories[0];
        if (first) {
          setForm((prev) => ({ ...prev, categoryId: first.id }));
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load transactions.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, yearMonth]);

  function resetForm() {
    setForm((prev) => ({
      amountMinor: "",
      categoryId: prev.categoryId || categories[0]?.id || "",
      date: todayDateInputValue(),
      note: "",
    }));
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }
    setError("");
    try {
      const payload = {
        amountMinor: Number(form.amountMinor),
        categoryId: form.categoryId,
        date: toIsoDate(form.date),
        note: form.note.trim() || null,
      };
      if (editingId) {
        await updateTransaction(token, editingId, payload);
      } else {
        await createTransaction(token, payload);
      }
      resetForm();
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save transaction.");
      }
    }
  }

  function startEdit(id: string) {
    const tx = transactions.find((entry) => entry.id === id);
    if (!tx) {
      return;
    }
    setEditingId(tx.id);
    setForm({
      amountMinor: `${tx.amountMinor}`,
      categoryId: tx.categoryId,
      date: fromIsoDate(tx.date),
      note: tx.note ?? "",
    });
  }

  async function handleDelete(id: string) {
    if (!token) {
      return;
    }
    setError("");
    try {
      await deleteTransaction(token, id);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to delete transaction.");
      }
    }
  }

  if (loading) {
    return <LoadingState label="Loading transactions..." />;
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice message={error} /> : null}

      <section className="card-surface p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">Filter month</span>
            <input
              className="field"
              type="month"
              value={yearMonth}
              onChange={(event) => setYearMonth(event.target.value)}
            />
          </label>
          <div className="md:col-span-2" />
        </div>
      </section>

      <section className="card-surface p-4">
        <h2 className="font-display text-xl font-bold text-brand-900">
          {editingId ? "Edit Transaction" : "Add Transaction"}
        </h2>
        <form className="mt-4 grid gap-4 md:grid-cols-5" onSubmit={handleSubmit}>
          <label className="space-y-1 md:col-span-1">
            <span className="text-sm text-brand-700">Amount (MMK)</span>
            <input
              className="field"
              type="number"
              min={1}
              step={1}
              required
              value={form.amountMinor}
              onChange={(event) => setForm((prev) => ({ ...prev, amountMinor: event.target.value }))}
            />
          </label>
          <label className="space-y-1 md:col-span-1">
            <span className="text-sm text-brand-700">Category</span>
            <select
              className="field"
              value={form.categoryId}
              onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              required
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 md:col-span-1">
            <span className="text-sm text-brand-700">Date</span>
            <input
              className="field"
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-brand-700">Note</span>
            <input
              className="field"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Optional note"
            />
          </label>
          <div className="md:col-span-5 flex flex-wrap gap-3">
            <button className="btn-primary" type="submit">
              {editingId ? "Update Transaction" : "Add Transaction"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card-surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-100 text-left text-brand-700">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-brand-100">
                <td className="px-4 py-3">{fromIsoDate(tx.date)}</td>
                <td className="px-4 py-3">{categoryMap.get(tx.categoryId)?.name ?? tx.categoryName}</td>
                <td className="px-4 py-3">{tx.type}</td>
                <td className={`px-4 py-3 font-semibold ${tx.type === "EXPENSE" ? "text-red-700" : "text-brand-700"}`}>
                  {formatMoney(tx.amountMinor)}
                </td>
                <td className="px-4 py-3">{tx.note ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary px-3 py-1 text-xs" onClick={() => startEdit(tx.id)}>
                      Edit
                    </button>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(tx.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-brand-500" colSpan={6}>
                  No transactions for this month yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
