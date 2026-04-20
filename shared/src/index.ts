export type CategoryType = "INCOME" | "EXPENSE";
export type TransactionType = "INCOME" | "EXPENSE";

export interface AuthPayload {
  id: string;
  email: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  type: CategoryType;
  isSeed: boolean;
  createdAt: string;
}

export interface TransactionDto {
  id: string;
  amountMinor: number;
  type: TransactionType;
  date: string;
  note: string | null;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

export interface BudgetItemDto {
  categoryId: string;
  categoryName: string;
  plannedMinor: number;
  spentMinor: number;
  remainingMinor: number;
}

export interface BudgetSummaryDto {
  totalPlannedMinor: number;
  totalSpentMinor: number;
  totalRawRemainingMinor: number;
  totalOverspentMinor: number;
  carryoverPoolMinor: number;
  carryoverUsedMinor: number;
  carryoverRemainingMinor: number;
  effectiveDeficitMinor: number;
}

export interface BudgetMonthDto {
  yearMonth: string;
  isClosed: boolean;
  summary: BudgetSummaryDto;
  items: BudgetItemDto[];
}

export interface MonthlyReportItemDto {
  yearMonth: string;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  totalPlannedMinor: number;
  totalSpentMinor: number;
  effectiveDeficitMinor: number;
}

export interface CategoryReportDto {
  categoryId: string;
  categoryName: string;
  plannedMinor: number;
  spentMinor: number;
}

export interface MonthlyReportDto {
  months: MonthlyReportItemDto[];
  categoryTotals: CategoryReportDto[];
}
