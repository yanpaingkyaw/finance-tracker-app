import { prisma } from "../src/lib/prisma.js";
import {
  closeBudgetMonth,
  computePoolUsage,
  getBudgetMonthView,
  replaceBudgetItems,
} from "../src/services/budget-service.js";
import { seedDefaultCategories } from "../src/services/seed.js";

describe("budget math and rollover", () => {
  it("computes carryover usage correctly", () => {
    const caseOne = computePoolUsage(1200, 500);
    expect(caseOne.carryoverUsedMinor).toBe(500);
    expect(caseOne.carryoverRemainingMinor).toBe(0);
    expect(caseOne.effectiveDeficitMinor).toBe(700);

    const caseTwo = computePoolUsage(400, 900);
    expect(caseTwo.carryoverUsedMinor).toBe(400);
    expect(caseTwo.carryoverRemainingMinor).toBe(500);
    expect(caseTwo.effectiveDeficitMinor).toBe(0);
  });

  it("rolls unused budget into next month pool and offsets overspend", async () => {
    const user = await prisma.user.create({
      data: {
        email: "budget@example.com",
        passwordHash: "hashed",
      },
    });
    await seedDefaultCategories(prisma, user.id);

    const expenseCategory = await prisma.category.findFirstOrThrow({
      where: {
        userId: user.id,
        type: "EXPENSE",
      },
    });

    await replaceBudgetItems(prisma, user.id, "2026-01", [
      {
        categoryId: expenseCategory.id,
        plannedMinor: 100000,
      },
    ]);

    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategory.id,
        type: "EXPENSE",
        amountMinor: 65000,
        date: new Date("2026-01-20T00:00:00.000Z"),
      },
    });

    await closeBudgetMonth(prisma, user.id, "2026-01");

    const feb = await getBudgetMonthView(prisma, user.id, "2026-02");
    expect(feb.summary.carryoverPoolMinor).toBe(35000);

    await replaceBudgetItems(prisma, user.id, "2026-02", [
      {
        categoryId: expenseCategory.id,
        plannedMinor: 30000,
      },
    ]);

    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategory.id,
        type: "EXPENSE",
        amountMinor: 50000,
        date: new Date("2026-02-03T00:00:00.000Z"),
      },
    });

    const febAfterSpend = await getBudgetMonthView(prisma, user.id, "2026-02");
    expect(febAfterSpend.summary.totalOverspentMinor).toBe(20000);
    expect(febAfterSpend.summary.carryoverUsedMinor).toBe(20000);
    expect(febAfterSpend.summary.carryoverRemainingMinor).toBe(15000);
    expect(febAfterSpend.summary.effectiveDeficitMinor).toBe(0);
  });
});
