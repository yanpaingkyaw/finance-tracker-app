process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.PORT = "4010";

import { prisma } from "../src/lib/prisma.js";

beforeEach(async () => {
  await prisma.budgetItem.deleteMany();
  await prisma.budgetMonth.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
