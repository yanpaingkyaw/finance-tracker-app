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
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"" | "INCOME" | "EXPENSE">("");
  const [categoryId, setCategoryId] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [note, setNote] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    amountMinor: "",
    categoryId: "",
    date: todayDateInputValue(),
    note: "",
  });

  const categoryMap = useMemo(() => new Map(categories.map((cat) => [cat.id, cat])), [categories]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setNote(noteInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [noteInput]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getCategories(token)
      .then((response) => {
        if (cancelled) return;
        setCategories(response.categories);
        setForm((prev) => ({ ...prev, categoryId: prev.categoryId || response.categories[0]?.id || "" }));
      })
      .catch((err) => {
        if (!cancelled) setCategoryError(err instanceof ApiError ? err.message : "Unable to load categories.");
      });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setListLoading(true);
    getTransactions(token, {
      yearMonth,
      ...(type ? { type } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(note ? { note } : {}),
      page,
      pageSize: 20,
    }, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        if (page > 1 && page > response.pagination.totalPages) {
          setPage(Math.max(1, response.pagination.totalPages));
          return;
        }
        setTransactions(response.transactions);
        setPagination(response.pagination);
        setError("");
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setTransactions([]);
          setPagination({ page, pageSize: 20, total: 0, totalPages: 0 });
          setError(err instanceof ApiError ? err.message : "Unable to load transactions.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setListLoading(false);
        }
      });
    return () => controller.abort();
  }, [token, yearMonth, type, categoryId, note, page, reloadKey]);

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
      if (editingId) {
        setReloadKey((value) => value + 1);
      } else {
        setPage(1);
        setReloadKey((value) => value + 1);
      }
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
      if (transactions.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setReloadKey((value) => value + 1);
      }
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
      {categoryError ? <ErrorNotice message={categoryError} /> : null}

      <section className="card-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">Filter month</span>
            <input
              className="field"
              type="month"
              value={yearMonth}
              onChange={(event) => { setYearMonth(event.target.value); setPage(1); }}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">Type</span>
            <select className="field" value={type} onChange={(event) => { setType(event.target.value as typeof type); setCategoryId(""); setPage(1); }}>
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">Category</span>
            <select className="field" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {categories.filter((category) => !type || category.type === type).map((category) => (
                <option key={category.id} value={category.id}>{category.name} ({category.type})</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-brand-700">Search notes</span>
            <input className="field" type="search" value={noteInput} maxLength={200} placeholder="Search notes" onChange={(event) => { setNoteInput(event.target.value); setPage(1); }} />
          </label>
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
        <table className="data-table min-w-full text-sm">
          <thead className="text-left text-brand-700">
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
            {!listLoading && transactions.map((tx) => (
              <tr key={tx.id}>
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
                    <button className="danger-button rounded-lg px-3 py-1 text-xs font-semibold" onClick={() => handleDelete(tx.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {listLoading || transactions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-brand-500" colSpan={6}>
                  {listLoading ? "Loading transactions..." : "No transactions match these filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {!listLoading && pagination.totalPages > 0 ? (
          <nav aria-label="Transaction pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 px-4 py-3">
            <span className="text-sm text-brand-600">{pagination.total} transactions · Page {page} of {pagination.totalPages}</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              {Array.from(new Set([1, page - 2, page - 1, page, page + 1, page + 2, pagination.totalPages]))
                .filter((number) => number >= 1 && number <= pagination.totalPages)
                .sort((a, b) => a - b)
                .map((number) => (
                  <button key={number} type="button" className={number === page ? "btn-primary px-3 py-1 text-sm" : "btn-secondary px-3 py-1 text-sm"} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>
                ))}
              <button type="button" className="btn-secondary px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
