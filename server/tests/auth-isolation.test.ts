import request from "supertest";
import { app } from "../src/app.js";

async function registerUser(email: string, password = "password123") {
  const response = await request(app).post("/auth/register").send({
    email,
    password,
  });
  return response.body as { token: string; user: { id: string; email: string } };
}

describe("auth and data isolation", () => {
  it("rejects protected routes without token", async () => {
    const response = await request(app).get("/categories");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("keeps transaction data isolated per user", async () => {
    const first = await registerUser("first@example.com");
    const second = await registerUser("second@example.com");

    const categoriesRes = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${first.token}`);
    const expenseCategory = categoriesRes.body.categories.find((entry: { type: string }) => entry.type === "EXPENSE");
    expect(expenseCategory).toBeTruthy();

    const createTx = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${first.token}`)
      .send({
        amountMinor: 20000,
        categoryId: expenseCategory.id,
        date: new Date("2026-04-07T00:00:00.000Z").toISOString(),
        note: "Lunch",
      });
    expect(createTx.status).toBe(201);

    const firstList = await request(app)
      .get("/transactions")
      .set("Authorization", `Bearer ${first.token}`);
    expect(firstList.status).toBe(200);
    expect(firstList.body.transactions).toHaveLength(1);

    const secondList = await request(app)
      .get("/transactions")
      .set("Authorization", `Bearer ${second.token}`);
    expect(secondList.status).toBe(200);
    expect(secondList.body.transactions).toHaveLength(0);

    const secondPatch = await request(app)
      .patch(`/transactions/${createTx.body.transaction.id}`)
      .set("Authorization", `Bearer ${second.token}`)
      .send({ note: "hijack" });
    expect(secondPatch.status).toBe(404);
  });
});
