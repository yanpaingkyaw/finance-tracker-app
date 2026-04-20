import { BudgetMonth, Prisma, PrismaClient } from "@prisma/client";
import { BudgetMonthDto, MonthlyReportDto } from "@mini-finance/shared";
import { AppError } from "../lib/errors.js";
import {
  assertYearMonth,
  monthRangeList,
  nextYearMonth,
  parseYearMonthToRange,
  previousYearMonth,
} from "../utils/date.js";

interface BudgetSnapshot {
  totalPlannedMinor: number;
  totalSpentMinor: number;
  totalRawRemainingMinor: number;
  totalOverspentMinor: number;
  totalUnusedMinor: number;
  carryoverPoolMinor: number;
  carryoverUsedMinor: number;
  carryoverRemainingMinor: number;
  effectiveDeficitMinor: number;
  spentByCategoryId: Map<string, number>;
}

export function computePoolUsage(totalOverspentMinor: number, carryoverPoolMinor: number) {
  const carryoverUsedMinor = Math.min(carryoverPoolMinor, totalOverspentMinor);
  const carryoverRemainingMinor = Math.max(0, carryoverPoolMinor - carryoverUsedMinor);
  const effectiveDeficitMinor = Math.max(0, totalOverspentMinor - carryoverUsedMinor);
  return {
    carryoverUsedMinor,
    carryoverRemainingMinor,
    effectiveDeficitMinor,
  };
}

async function getSpentByCategory(
  prisma: PrismaClient,
  userId: string,
  yearMonth: string,
): Promise<Map<string, number>> {
  const { start, end } = parseYearMonthToRange(yearMonth);
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amountMinor: true,
    },
  });

  return new Map(
    grouped.map((entry) => [entry.categoryId, entry._sum.amountMinor ?? 0]),
  );
}

async function buildSnapshot(
  prisma: PrismaClient,
  userId: string,
  budgetMonth: BudgetMonth,
): Promise<BudgetSnapshot> {
  const items = await prisma.budgetItem.findMany({
    where: {
      budgetMonthId: budgetMonth.id,
    },
  });
  const spentByCategoryId = await getSpentByCategory(prisma, userId, budgetMonth.yearMonth);

  let totalPlannedMinor = 0;
  let totalSpentMinor = 0;
  let totalOverspentMinor = 0;
  let totalUnusedMinor = 0;

  for (const item of items) {
    const spentMinor = spentByCategoryId.get(item.categoryId) ?? 0;
    const remainingMinor = item.plannedMinor - spentMinor;
    totalPlannedMinor += item.plannedMinor;
    totalSpentMinor += spentMinor;
    if (remainingMinor < 0) {
      totalOverspentMinor += Math.abs(remainingMinor);
    } else {
      totalUnusedMinor += remainingMinor;
    }
  }

  const totalRawRemainingMinor = totalPlannedMinor - totalSpentMinor;
  const { carryoverUsedMinor, carryoverRemainingMinor, effectiveDeficitMinor } = computePoolUsage(
    totalOverspentMinor,
    budgetMonth.carryoverPoolMinor,
  );

  return {
    totalPlannedMinor,
    totalSpentMinor,
    totalRawRemainingMinor,
    totalOverspentMinor,
    totalUnusedMinor,
    carryoverPoolMinor: budgetMonth.carryoverPoolMinor,
    carryoverUsedMinor,
    carryoverRemainingMinor,
    effectiveDeficitMinor,
    spentByCategoryId,
  };
}

export async function ensureBudgetMonth(
  prisma: PrismaClient,
  userId: string,
  yearMonthInput: string,
): Promise<BudgetMonth> {
  const yearMonth = assertYearMonth(yearMonthInput);
  const existing = await prisma.budgetMonth.findUnique({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth,
      },
    },
  });
  if (existing) {
    return existing;
  }

  const prevYm = previousYearMonth(yearMonth);
  const prevMonth = await prisma.budgetMonth.findUnique({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth: prevYm,
      },
    },
  });

  let carryoverPoolMinor = 0;
  let plannedFromPrevious: Array<{ categoryId: string; plannedMinor: number }> = [];
  if (prevMonth) {
    const snapshot = await buildSnapshot(prisma, userId, prevMonth);
    carryoverPoolMinor = snapshot.totalUnusedMinor + snapshot.carryoverRemainingMinor;
    plannedFromPrevious = await prisma.budgetItem.findMany({
      where: { budgetMonthId: prevMonth.id },
      select: { categoryId: true, plannedMinor: true },
    });
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.budgetMonth.create({
      data: {
        userId,
        yearMonth,
        carryoverPoolMinor,
      },
    });

    if (plannedFromPrevious.length > 0) {
      await tx.budgetItem.createMany({
        data: plannedFromPrevious.map((item) => ({
          budgetMonthId: created.id,
          categoryId: item.categoryId,
          plannedMinor: item.plannedMinor,
        })),
      });
    }

    return created;
  });
}

export async function getBudgetMonthView(
  prisma: PrismaClient,
  userId: string,
  yearMonthInput: string,
): Promise<BudgetMonthDto> {
  const yearMonth = assertYearMonth(yearMonthInput);
  const budgetMonth = await ensureBudgetMonth(prisma, userId, yearMonth);
  const snapshot = await buildSnapshot(prisma, userId, budgetMonth);

  const expenseCategories = await prisma.category.findMany({
    where: { userId, type: "EXPENSE" },
    orderBy: { name: "asc" },
  });
  const items = await prisma.budgetItem.findMany({
    where: { budgetMonthId: budgetMonth.id },
  });
  const plannedByCategoryId = new Map(items.map((item) => [item.categoryId, item.plannedMinor]));

  return {
    yearMonth,
    isClosed: Boolean(budgetMonth.closedAt),
    summary: {
      totalPlannedMinor: snapshot.totalPlannedMinor,
      totalSpentMinor: snapshot.totalSpentMinor,
      totalRawRemainingMinor: snapshot.totalRawRemainingMinor,
      totalOverspentMinor: snapshot.totalOverspentMinor,
      carryoverPoolMinor: snapshot.carryoverPoolMinor,
      carryoverUsedMinor: snapshot.carryoverUsedMinor,
      carryoverRemainingMinor: snapshot.carryoverRemainingMinor,
      effectiveDeficitMinor: snapshot.effectiveDeficitMinor,
    },
    items: expenseCategories.map((category) => {
      const plannedMinor = plannedByCategoryId.get(category.id) ?? 0;
      const spentMinor = snapshot.spentByCategoryId.get(category.id) ?? 0;
      return {
        categoryId: category.id,
        categoryName: category.name,
        plannedMinor,
        spentMinor,
        remainingMinor: plannedMinor - spentMinor,
      };
    }),
  };
}

export async function replaceBudgetItems(
  prisma: PrismaClient,
  userId: string,
  yearMonthInput: string,
  itemsInput: Array<{ categoryId: string; plannedMinor: number }>,
): Promise<BudgetMonthDto> {
  const yearMonth = assertYearMonth(yearMonthInput);
  const budgetMonth = await ensureBudgetMonth(prisma, userId, yearMonth);
  const deduped = new Map<string, number>();
  for (const item of itemsInput) {
    deduped.set(item.categoryId, item.plannedMinor);
  }
  const items = Array.from(deduped.entries()).map(([categoryId, plannedMinor]) => ({
    categoryId,
    plannedMinor,
  }));

  const categories = await prisma.category.findMany({
    where: {
      userId,
      type: "EXPENSE",
      id: {
        in: items.map((item) => item.categoryId),
      },
    },
    select: { id: true },
  });
  const categoryIds = new Set(categories.map((entry) => entry.id));
  if (items.some((item) => !categoryIds.has(item.categoryId))) {
    throw new AppError("Each budget item category must be an expense category owned by the user", 400, "VALIDATION_ERROR");
  }

  await prisma.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({
      where: {
        budgetMonthId: budgetMonth.id,
      },
    });

    if (items.length > 0) {
      await tx.budgetItem.createMany({
        data: items.map((item) => ({
          budgetMonthId: budgetMonth.id,
          categoryId: item.categoryId,
          plannedMinor: item.plannedMinor,
        })),
      });
    }
  });

  return getBudgetMonthView(prisma, userId, yearMonth);
}

export async function closeBudgetMonth(
  prisma: PrismaClient,
  userId: string,
  yearMonthInput: string,
): Promise<{ closedYearMonth: string; nextYearMonth: string }> {
  const yearMonth = assertYearMonth(yearMonthInput);
  const month = await ensureBudgetMonth(prisma, userId, yearMonth);
  await prisma.budgetMonth.update({
    where: { id: month.id },
    data: { closedAt: new Date() },
  });

  const next = nextYearMonth(yearMonth);
  await ensureBudgetMonth(prisma, userId, next);

  return {
    closedYearMonth: yearMonth,
    nextYearMonth: next,
  };
}

export async function getMonthlyReport(
  prisma: PrismaClient,
  userId: string,
  fromInput: string,
  toInput: string,
): Promise<MonthlyReportDto> {
  const months = monthRangeList(fromInput, toInput);
  const categoryTotals = new Map<string, { categoryId: string; categoryName: string; plannedMinor: number; spentMinor: number }>();
  const monthRows: MonthlyReportDto["months"] = [];

  for (const yearMonth of months) {
    const view = await getBudgetMonthView(prisma, userId, yearMonth);
    const { start, end } = parseYearMonthToRange(yearMonth);
    const txns = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    const incomeMinor = txns
      .filter((tx) => tx.type === "INCOME")
      .reduce((sum, tx) => sum + tx.amountMinor, 0);
    const expenseMinor = txns
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + tx.amountMinor, 0);

    monthRows.push({
      yearMonth,
      incomeMinor,
      expenseMinor,
      netMinor: incomeMinor - expenseMinor,
      totalPlannedMinor: view.summary.totalPlannedMinor,
      totalSpentMinor: view.summary.totalSpentMinor,
      effectiveDeficitMinor: view.summary.effectiveDeficitMinor,
    });

    for (const item of view.items) {
      const existing = categoryTotals.get(item.categoryId);
      if (existing) {
        existing.plannedMinor += item.plannedMinor;
        existing.spentMinor += item.spentMinor;
      } else {
        categoryTotals.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          plannedMinor: item.plannedMinor,
          spentMinor: item.spentMinor,
        });
      }
    }
  }

  return {
    months: monthRows,
    categoryTotals: Array.from(categoryTotals.values()).sort((a, b) => b.spentMinor - a.spentMinor),
  };
}

export function buildTransactionFilter(userId: string, yearMonth?: string): Prisma.TransactionWhereInput {
  if (!yearMonth) {
    return { userId };
  }

  const { start, end } = parseYearMonthToRange(yearMonth);
  return {
    userId,
    date: {
      gte: start,
      lt: end,
    },
  };
}
