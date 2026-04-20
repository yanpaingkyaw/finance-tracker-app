import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(50),
    type: z.enum(["INCOME", "EXPENSE"]),
  }),
});

const patchSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
  }),
});

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    res.json({ categories });
  }),
);

router.post(
  "/",
  validateRequest(createSchema),
  asyncHandler(async (req, res) => {
    const payload = createSchema.shape.body.parse(req.body);
    const created = await prisma.category.create({
      data: {
        userId: req.user!.id,
        name: payload.name.trim(),
        type: payload.type,
      },
    });

    res.status(201).json({ category: created });
  }),
);

router.patch(
  "/:id",
  validateRequest(patchSchema),
  asyncHandler(async (req, res) => {
    const { id } = patchSchema.shape.params.parse(req.params);
    const payload = patchSchema.shape.body.parse(req.body);
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });
    if (!category) {
      throw new AppError("Category not found", 404, "NOT_FOUND");
    }

    const updated = await prisma.category.update({
      where: { id: category.id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
        ...(payload.type !== undefined ? { type: payload.type } : {}),
      },
    });
    res.json({ category: updated });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().min(1).parse(req.params.id);
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });
    if (!category) {
      throw new AppError("Category not found", 404, "NOT_FOUND");
    }

    const usageCount = await prisma.transaction.count({
      where: {
        categoryId: id,
        userId: req.user!.id,
      },
    });
    const budgetUsage = await prisma.budgetItem.count({
      where: {
        categoryId: id,
        budgetMonth: {
          userId: req.user!.id,
        },
      },
    });

    if (usageCount > 0 || budgetUsage > 0) {
      throw new AppError("Cannot delete category already used in transactions or budgets", 409, "CATEGORY_IN_USE");
    }

    await prisma.category.delete({
      where: {
        id: category.id,
      },
    });
    res.status(204).send();
  }),
);

export default router;
