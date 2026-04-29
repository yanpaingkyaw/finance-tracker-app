import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import {
  closeBudgetMonth,
  getBudgetMonthView,
  replaceBudgetItems,
} from "../services/budget-service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { assertYearMonth } from "../utils/date.js";

const router = Router();

const paramsSchema = z.object({
  params: z.object({
    yearMonth: z.string(),
  }),
});

const budgetItemSchema = z.object({
  categoryId: z.string().min(1),
  plannedMinor: z.number().int().min(0),
});

const updateItemsSchema = z.object({
  params: z.object({
    yearMonth: z.string(),
  }),
  body: z.object({
    items: z.array(budgetItemSchema),
  }),
});

router.use(requireAuth);

router.get(
  "/:yearMonth",
  validateRequest(paramsSchema),
  asyncHandler(async (req, res) => {
    const { yearMonth } = paramsSchema.shape.params.parse(req.params);

    const budget = await getBudgetMonthView(
      prisma,
      req.user!.id,
      assertYearMonth(yearMonth),
    );

    res.json({ budget });
  }),
);

router.put(
  "/:yearMonth/items",
  validateRequest(updateItemsSchema),
  asyncHandler(async (req, res) => {
    const { yearMonth } = updateItemsSchema.shape.params.parse(req.params);
    const parsedBody = updateItemsSchema.shape.body.parse(req.body);

    const items: Array<{ categoryId: string; plannedMinor: number }> =
      parsedBody.items.map((item) => ({
        categoryId: item.categoryId as string,
        plannedMinor: item.plannedMinor as number,
      }));

    const budget = await replaceBudgetItems(
      prisma,
      req.user!.id,
      assertYearMonth(yearMonth),
      items,
    );

    res.json({ budget });
  }),
);

router.post(
  "/:yearMonth/close",
  validateRequest(paramsSchema),
  asyncHandler(async (req, res) => {
    const { yearMonth } = paramsSchema.shape.params.parse(req.params);

    const result = await closeBudgetMonth(
      prisma,
      req.user!.id,
      assertYearMonth(yearMonth),
    );

    res.json(result);
  }),
);

export default router;