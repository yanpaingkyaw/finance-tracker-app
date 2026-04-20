import { BudgetMonthDto, CategoryType } from "@mini-finance/shared";
import { apiRequest } from "./client";
import {
  AuthResponse,
  BudgetResponse,
  CategoriesResponse,
  ReportResponse,
  TransactionsResponse,
} from "../types/api";

export async function register(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(token: string) {
  return apiRequest<{ user: { id: string; email: string } }>("/auth/me", {
    token,
  });
}

export async function getCategories(token: string) {
  return apiRequest<CategoriesResponse>("/categories", { token });
}

export async function createCategory(token: string, payload: { name: string; type: CategoryType }) {
  return apiRequest<{ category: { id: string } }>("/categories", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  token: string,
  id: string,
  payload: Partial<{ name: string; type: CategoryType }>,
) {
  return apiRequest<{ category: { id: string } }>(`/categories/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(token: string, id: string) {
  return apiRequest<void>(`/categories/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function getTransactions(token: string, yearMonth?: string) {
  const query = yearMonth ? `?yearMonth=${yearMonth}` : "";
  return apiRequest<TransactionsResponse>(`/transactions${query}`, {
    token,
  });
}

export async function createTransaction(
  token: string,
  payload: { amountMinor: number; categoryId: string; date: string; note?: string | null },
) {
  return apiRequest<{ transaction: { id: string } }>("/transactions", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(
  token: string,
  id: string,
  payload: Partial<{ amountMinor: number; categoryId: string; date: string; note: string | null }>,
) {
  return apiRequest<{ transaction: { id: string } }>(`/transactions/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(token: string, id: string) {
  return apiRequest<void>(`/transactions/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function getBudget(token: string, yearMonth: string) {
  return apiRequest<BudgetResponse>(`/budgets/${yearMonth}`, {
    token,
  });
}

export async function updateBudgetItems(
  token: string,
  yearMonth: string,
  items: Array<{ categoryId: string; plannedMinor: number }>,
) {
  return apiRequest<BudgetResponse>(`/budgets/${yearMonth}/items`, {
    method: "PUT",
    token,
    body: JSON.stringify({ items }),
  });
}

export async function closeMonth(token: string, yearMonth: string) {
  return apiRequest<{ closedYearMonth: string; nextYearMonth: string }>(`/budgets/${yearMonth}/close`, {
    method: "POST",
    token,
  });
}

export async function getMonthlyReport(token: string, from: string, to: string) {
  return apiRequest<ReportResponse>(`/reports/monthly?from=${from}&to=${to}`, {
    token,
  });
}

export function updateBudgetDraft(
  source: BudgetMonthDto,
  categoryId: string,
  plannedMinor: number,
): BudgetMonthDto {
  return {
    ...source,
    items: source.items.map((item) =>
      item.categoryId === categoryId
        ? {
            ...item,
            plannedMinor,
            remainingMinor: plannedMinor - item.spentMinor,
          }
        : item,
    ),
  };
}
