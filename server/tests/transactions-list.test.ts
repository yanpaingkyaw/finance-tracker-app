import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

async function createUser(email: string) {
  const response = await request(app).post("/auth/register").send({ email, password: "password123" });
  const token = response.body.token as string;
  const categories = await request(app).get("/categories").set("Authorization", `Bearer ${token}`);
  return {
    token,
    userId: response.body.user.id as string,
    foodId: categories.body.categories.find((entry: { name: string }) => entry.name === "Food").id as string,
    transportId: categories.body.categories.find((entry: { name: string }) => entry.name === "Transport").id as string,
    salaryId: categories.body.categories.find((entry: { name: string }) => entry.name === "Salary").id as string,
  };
}

describe("transaction list", () => {
  it("paginates deterministically and reports matching totals", async () => {
    const user = await createUser("pages@example.com");
    await prisma.transaction.createMany({
      data: Array.from({ length: 23 }, (_, index) => ({
        userId: user.userId,
        categoryId: user.foodId,
        type: "EXPENSE" as const,
        amountMinor: index + 1,
        date: new Date("2026-04-10T12:00:00.000Z"),
        createdAt: new Date("2026-04-10T12:00:00.000Z"),
        note: `Lunch ${index}`,
      })),
    });
    const first = await request(app).get("/transactions?yearMonth=2026-04&page=1")
      .set("Authorization", `Bearer ${user.token}`);
    const second = await request(app).get("/transactions?yearMonth=2026-04&page=2")
      .set("Authorization", `Bearer ${user.token}`);
    expect(first.status).toBe(200);
    expect(first.body.pagination).toEqual({ page: 1, pageSize: 20, total: 23, totalPages: 2 });
    expect(first.body.transactions).toHaveLength(20);
    expect(second.body.transactions).toHaveLength(3);
    expect(new Set([...first.body.transactions, ...second.body.transactions].map((tx: { id: string }) => tx.id)).size).toBe(23);
    expect(first.body.transactions.map((tx: { id: string }) => tx.id)).toEqual(
      [...first.body.transactions].map((tx: { id: string }) => tx.id).sort().reverse(),
    );
    const beyond = await request(app).get("/transactions?page=3")
      .set("Authorization", `Bearer ${user.token}`);
    expect(beyond.body.transactions).toEqual([]);
    expect(beyond.body.pagination.total).toBe(23);
  });

  it("combines filters and keeps results scoped to the authenticated user", async () => {
    const first = await createUser("filters@example.com");
    const second = await createUser("other@example.com");
    await prisma.transaction.createMany({ data: [
      { userId: first.userId, categoryId: first.foodId, type: "EXPENSE", amountMinor: 100, date: new Date("2026-04-10T12:00:00Z"), note: "Lunch" },
      { userId: first.userId, categoryId: first.transportId, type: "EXPENSE", amountMinor: 200, date: new Date("2026-04-10T12:00:00Z"), note: "Lunch trip" },
      { userId: first.userId, categoryId: first.salaryId, type: "INCOME", amountMinor: 300, date: new Date("2026-04-10T12:00:00Z"), note: "Lunch bonus" },
      { userId: first.userId, categoryId: first.foodId, type: "EXPENSE", amountMinor: 400, date: new Date("2026-05-10T12:00:00Z"), note: "Lunch" },
      { userId: second.userId, categoryId: second.foodId, type: "EXPENSE", amountMinor: 500, date: new Date("2026-04-10T12:00:00Z"), note: "Lunch" },
    ] });
    const result = await request(app)
      .get(`/transactions?yearMonth=2026-04&type=EXPENSE&categoryId=${first.foodId}&note=%20lUnCh%20`)
      .set("Authorization", `Bearer ${first.token}`);
    expect(result.status).toBe(200);
    expect(result.body.transactions.map((tx: { amountMinor: number }) => tx.amountMinor)).toEqual([100]);
    expect(result.body.pagination.total).toBe(1);
    const otherCategory = await request(app)
      .get(`/transactions?categoryId=${second.foodId}`)
      .set("Authorization", `Bearer ${first.token}`);
    expect(otherCategory.body.pagination.total).toBe(0);
  });

  it.each(["page=0", "pageSize=101", "type=OTHER", "page=abc", "yearMonth=2026-13"])(
    "rejects invalid query %s",
    async (query) => {
      const user = await createUser(`invalid-${query.replace(/\W/g, "-")}@example.com`);
      const response = await request(app).get(`/transactions?${query}`)
        .set("Authorization", `Bearer ${user.token}`);
      expect(response.status).toBe(400);
    },
  );
});
