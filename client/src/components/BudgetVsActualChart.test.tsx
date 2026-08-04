import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BudgetVsActualChart } from "./BudgetVsActualChart";

describe("BudgetVsActualChart", () => {
  it("renders budget and actual bars for each item", () => {
    render(
      <BudgetVsActualChart
        title="Budget vs Actual"
        items={[
          { label: "2026-03", budgetMinor: 100000, actualMinor: 80000 },
          { label: "2026-04", budgetMinor: 120000, actualMinor: 150000 },
        ]}
      />,
    );

    expect(screen.getByText("Budget vs Actual")).toBeInTheDocument();
    expect(screen.getByText("2026-03")).toBeInTheDocument();
    expect(screen.getByText("2026-04")).toBeInTheDocument();
    expect(screen.getByLabelText(/budget versus actual amounts by group/i)).toBeInTheDocument();
  });

  it("shows empty state when there is no data", () => {
    render(<BudgetVsActualChart title="Budget vs Actual" items={[]} />);
    expect(screen.getByText(/no budget or transaction data/i)).toBeInTheDocument();
  });
});
