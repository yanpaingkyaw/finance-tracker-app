import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { seedDefaultCategories } from "../services/seed.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

function signToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: "7d",
  });
}

router.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = registerSchema.shape.body.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      throw new AppError("Email already registered", 409, "EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash },
      select: { id: true, email: true },
    });
    await seedDefaultCategories(prisma, user.id);

    const token = signToken(user);
    res.status(201).json({
      token,
      user,
    });
  }),
);

router.post(
  "/login",
  validateRequest(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.shape.body.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const token = signToken({ id: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    res.json({ user });
  }),
);

export default router;
