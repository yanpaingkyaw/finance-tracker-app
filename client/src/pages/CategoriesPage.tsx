import { FormEvent, useEffect, useState } from "react";
import { CategoryType } from "@mini-finance/shared";
import { ApiError } from "../api/client";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../api/services";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";

export function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>["categories"]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [editing, setEditing] = useState<{ id: string; name: string; type: CategoryType } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!token) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await getCategories(token);
      setCategories(response.categories);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load categories.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setError("");
    try {
      if (editing) {
        await updateCategory(token, editing.id, { name, type });
      } else {
        await createCategory(token, { name, type });
      }
      setName("");
      setType("EXPENSE");
      setEditing(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save category.");
      }
    }
  }

  async function onDelete(id: string) {
    if (!token) {
      return;
    }
    setError("");
    try {
      await deleteCategory(token, id);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to delete category.");
      }
    }
  }

  function onEdit(id: string) {
    const category = categories.find((item) => item.id === id);
    if (!category) {
      return;
    }
    setEditing({
      id: category.id,
      name: category.name,
      type: category.type,
    });
    setName(category.name);
    setType(category.type);
  }

  function cancelEdit() {
    setEditing(null);
    setName("");
    setType("EXPENSE");
  }

  if (loading) {
    return <LoadingState label="Loading categories..." />;
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice message={error} /> : null}

      <section className="card-surface p-4">
        <h2 className="font-display text-xl font-bold text-brand-900">
          {editing ? "Edit Category" : "Create Category"}
        </h2>
        <form className="mt-4 grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-brand-700">Name</span>
            <input className="field" required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="space-y-1 md:col-span-1">
            <span className="text-sm text-brand-700">Type</span>
            <select
              className="field"
              value={type}
              onChange={(event) => setType(event.target.value as CategoryType)}
            >
              <option value="EXPENSE">EXPENSE</option>
              <option value="INCOME">INCOME</option>
            </select>
          </label>
          <div className="md:col-span-1 flex items-end gap-2">
            <button className="btn-primary w-full" type="submit">
              {editing ? "Update" : "Create"}
            </button>
            {editing ? (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card-surface overflow-x-auto">
        <table className="data-table min-w-full text-sm">
          <thead className="text-left text-brand-700">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-3">{category.name}</td>
                <td className="px-4 py-3">{category.type}</td>
                <td className="px-4 py-3">{category.isSeed ? "Seed" : "Custom"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary px-3 py-1 text-xs" onClick={() => onEdit(category.id)}>
                      Edit
                    </button>
                    <button className="danger-button rounded-lg px-3 py-1 text-xs font-semibold" onClick={() => onDelete(category.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-brand-500" colSpan={4}>
                  No categories yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
