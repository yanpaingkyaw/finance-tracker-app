import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { buildTransactionFilter } from "../services/budget-service.js";
import { assertYearMonth } from "../utils/date.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

const transactionBodySchema = z.object({
  amountMinor: z.number().int().positive(),
  categoryId: z.string().min(1),
  date: z.string().datetime(),
  note: z.string().trim().max(200).optional().nullable(),
});

const createSchema = z.object({
  body: transactionBodySchema,
});

const patchSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: transactionBodySchema.partial(),
});

const listQuerySchema = z.object({
  query: z.object({
    yearMonth: z.string().optional(),
  }),
});

router.use(requireAuth);

router.get(
  "/",
  validateRequest(listQuerySchema),
  asyncHandler(async (req, res) => {
    const parsedQuery = listQuerySchema.shape.query.parse(req.query);
    if (parsedQuery.yearMonth) {
      assertYearMonth(parsedQuery.yearMonth);
    }

    const transactions = await prisma.transaction.findMany({
      where: buildTransactionFilter(req.user!.id, parsedQuery.yearMonth),
      include: {
        category: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    res.json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        amountMinor: tx.amountMinor,
        type: tx.type,
        date: tx.date.toISOString(),
        note: tx.note,
        categoryId: tx.categoryId,
        categoryName: tx.category.name,
        createdAt: tx.createdAt.toISOString(),
      })),
    });
  }),
);

router.post(
  "/",
  validateRequest(createSchema),
  asyncHandler(async (req, res) => {
    const payload = createSchema.shape.body.parse(req.body);
    const category = await prisma.category.findFirst({
      where: {
        id: payload.categoryId,
        userId: req.user!.id,
      },
    });
    if (!category) {
      throw new AppError("Category not found", 404, "NOT_FOUND");
    }

    const created = await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        categoryId: payload.categoryId,
        amountMinor: payload.amountMinor,
        date: new Date(payload.date),
        note: payload.note?.trim() || null,
        type: category.type,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      transaction: {
        id: created.id,
        amountMinor: created.amountMinor,
        type: created.type,
        date: created.date.toISOString(),
        note: created.note,
        categoryId: created.categoryId,
        categoryName: created.category.name,
        createdAt: created.createdAt.toISOString(),
      },
    });
  }),
);

router.patch(
  "/:id",
  validateRequest(patchSchema),
  asyncHandler(async (req, res) => {
    const { id } = patchSchema.shape.params.parse(req.params);
    const payload = patchSchema.shape.body.parse(req.body);

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });
    if (!existing) {
      throw new AppError("Transaction not found", 404, "NOT_FOUND");
    }

    let categoryType = existing.type;
    if (payload.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: payload.categoryId,
          userId: req.user!.id,
        },
      });
      if (!category) {
        throw new AppError("Category not found", 404, "NOT_FOUND");
      }
      categoryType = category.type;
    }

    const updated = await prisma.transaction.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(payload.amountMinor !== undefined ? { amountMinor: payload.amountMinor } : {}),
        ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
        ...(payload.date !== undefined ? { date: new Date(payload.date) } : {}),
        ...(payload.note !== undefined ? { note: payload.note?.trim() || null } : {}),
        type: categoryType,
      },
    });

    const updatedWithCategory = await prisma.transaction.findUnique({
      where: { id: updated.id },
      include: { category: true },
    });
    if (!updatedWithCategory) {
      throw new AppError("Transaction not found", 404, "NOT_FOUND");
    }

    res.json({
      transaction: {
        id: updatedWithCategory.id,
        amountMinor: updatedWithCategory.amountMinor,
        type: updatedWithCategory.type,
        date: updatedWithCategory.date.toISOString(),
        note: updatedWithCategory.note,
        categoryId: updatedWithCategory.categoryId,
        categoryName: updatedWithCategory.category.name,
        createdAt: updatedWithCategory.createdAt.toISOString(),
      },
    });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().min(1).parse(req.params.id);
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });
    if (!existing) {
      throw new AppError("Transaction not found", 404, "NOT_FOUND");
    }

    await prisma.transaction.delete({
      where: {
        id: existing.id,
      },
    });
    res.status(204).send();
  }),
);

export default router;
