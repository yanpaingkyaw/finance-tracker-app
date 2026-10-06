import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionsPage } from "./TransactionsPage";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../api/services", () => ({
  getCategories: vi.fn(),
  getTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

import { deleteTransaction, getCategories, getTransactions } from "../api/services";
import { useAuth } from "../hooks/useAuth";

describe("TransactionsPage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      token: "test-token",
      user: { id: "u1", email: "test@example.com" },
      loading: false,
      login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    });
    vi.mocked(getCategories).mockResolvedValue({ categories: [
      { id: "food", name: "Food", type: "EXPENSE", isSeed: true, createdAt: "2026-04-10T12:00:00.000Z" },
    ] });
    vi.mocked(getTransactions).mockImplementation(async (_token, options) => ({
      transactions: [{
        id: `tx-${options?.page}`,
        amountMinor: 100,
        type: "EXPENSE",
        date: "2026-04-10T12:00:00.000Z",
        note: options?.page === 2 ? "Second page" : "First page",
        categoryId: "food",
        categoryName: "Food",
        createdAt: "2026-04-10T12:00:00.000Z",
      }],
      pagination: { page: options?.page ?? 1, pageSize: 20, total: 21, totalPages: 2 },
    }));
  });

  it("navigates numbered pages and resets to page one when a filter changes", async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);
    expect(await screen.findByText("First page")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(await screen.findByText("Second page")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Type"), "EXPENSE");
    await waitFor(() => expect(vi.mocked(getTransactions)).toHaveBeenLastCalledWith(
      "test-token", expect.objectContaining({ page: 1, type: "EXPENSE" }), expect.any(AbortSignal),
    ));
    expect(await screen.findByText("First page")).toBeInTheDocument();
  });

  it("returns to the previous page when the last row is deleted", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTransaction).mockResolvedValue(undefined);
    render(<TransactionsPage />);
    await screen.findByText("First page");
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    await screen.findByText("Second page");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteTransaction).toHaveBeenCalledWith("test-token", "tx-2"));
    expect(await screen.findByText("First page")).toBeInTheDocument();
  });
});
