import { BudgetMonthDto, CategoryDto, MonthlyReportDto, TransactionDto } from "@mini-finance/shared";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface CategoriesResponse {
  categories: CategoryDto[];
}

export interface TransactionsResponse {
  transactions: TransactionDto[];
}

export interface BudgetResponse {
  budget: BudgetMonthDto;
}

export interface ReportResponse {
  report: MonthlyReportDto;
}
