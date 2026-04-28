const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for backend tests.");
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = process.env.DIRECT_URL ?? testDatabaseUrl;
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
