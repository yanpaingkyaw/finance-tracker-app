import { prisma } from "../src/lib/prisma.js";
import { getMonthlyReport, replaceBudgetItems } from "../src/services/budget-service.js";
import { seedDefaultCategories } from "../src/services/seed.js";

describe("monthly report totals", () => {
  it("returns consistent income expense and net values", async () => {
    const user = await prisma.user.create({
      data: {
        email: "report@example.com",
        passwordHash: "hashed",
      },
    });
    await seedDefaultCategories(prisma, user.id);

    const salary = await prisma.category.findFirstOrThrow({
      where: { userId: user.id, type: "INCOME" },
    });
    const expense = await prisma.category.findFirstOrThrow({
      where: { userId: user.id, type: "EXPENSE" },
    });

    await replaceBudgetItems(prisma, user.id, "2026-03", [
      { categoryId: expense.id, plannedMinor: 200000 },
    ]);

    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          categoryId: salary.id,
          type: "INCOME",
          amountMinor: 500000,
          date: new Date("2026-03-01T00:00:00.000Z"),
        },
        {
          userId: user.id,
          categoryId: expense.id,
          type: "EXPENSE",
          amountMinor: 150000,
          date: new Date("2026-03-05T00:00:00.000Z"),
        },
      ],
    });

    const report = await getMonthlyReport(prisma, user.id, "2026-03", "2026-03");
    expect(report.months).toHaveLength(1);
    expect(report.months[0]).toMatchObject({
      yearMonth: "2026-03",
      incomeMinor: 500000,
      expenseMinor: 150000,
      netMinor: 350000,
      totalPlannedMinor: 200000,
      totalSpentMinor: 150000,
      effectiveDeficitMinor: 0,
    });
  });
});
