import { CategoryType, PrismaClient } from "@prisma/client";

const DEFAULT_CATEGORIES: Array<{ name: string; type: CategoryType }> = [
  { name: "Salary", type: "INCOME" },
  { name: "Freelance", type: "INCOME" },
  { name: "Other Income", type: "INCOME" },
  { name: "Food", type: "EXPENSE" },
  { name: "Transport", type: "EXPENSE" },
  { name: "Utilities", type: "EXPENSE" },
  { name: "Rent", type: "EXPENSE" },
  { name: "Health", type: "EXPENSE" },
  { name: "Shopping", type: "EXPENSE" },
  { name: "Entertainment", type: "EXPENSE" },
  { name: "Misc", type: "EXPENSE" },
];

export async function seedDefaultCategories(prisma: PrismaClient, userId: string): Promise<void> {
  for (const entry of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId,
          name: entry.name,
          type: entry.type,
        },
      },
      update: {},
      create: {
        userId,
        name: entry.name,
        type: entry.type,
        isSeed: true,
      },
    });
  }
}
