import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/services", () => ({
  getBudget: vi.fn(),
  getMonthlyReport: vi.fn(),
}));

import { getBudget, getMonthlyReport } from "../api/services";
import { useAuth } from "../hooks/useAuth";

describe("DashboardPage", () => {
  it("renders budget health with carryover message", async () => {
    vi.mocked(useAuth).mockReturnValue({
      token: "test-token",
      user: { id: "u1", email: "test@example.com" },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(getBudget).mockResolvedValue({
      budget: {
        yearMonth: "2026-04",
        isClosed: false,
        summary: {
          totalPlannedMinor: 100000,
          totalSpentMinor: 120000,
          totalRawRemainingMinor: -20000,
          totalOverspentMinor: 20000,
          carryoverPoolMinor: 30000,
          carryoverUsedMinor: 20000,
          carryoverRemainingMinor: 10000,
          effectiveDeficitMinor: 0,
        },
        items: [],
      },
    });
    vi.mocked(getMonthlyReport).mockResolvedValue({
      report: {
        months: [
          {
            yearMonth: "2026-04",
            incomeMinor: 300000,
            expenseMinor: 120000,
            netMinor: 180000,
            totalPlannedMinor: 100000,
            totalSpentMinor: 120000,
            effectiveDeficitMinor: 0,
          },
        ],
        categoryTotals: [],
      },
    });

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("Overspending detected, but carryover pool covered it this month.")).toBeInTheDocument(),
    );
    expect(screen.getByText("Total Planned")).toBeInTheDocument();
  });
});
