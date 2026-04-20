import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { getMonthlyReport } from "../services/budget-service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { assertYearMonth, getYearMonth } from "../utils/date.js";

const router = Router();

const querySchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

router.use(requireAuth);

router.get(
  "/monthly",
  validateRequest(querySchema),
  asyncHandler(async (req, res) => {
    const { from, to } = querySchema.shape.query.parse(req.query);
    const current = getYearMonth(new Date());
    const fromYm = assertYearMonth(from ?? current);
    const toYm = assertYearMonth(to ?? current);
    const report = await getMonthlyReport(prisma, req.user!.id, fromYm, toYm);
    res.json({ report });
  }),
);

export default router;
