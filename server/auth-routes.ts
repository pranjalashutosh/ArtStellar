import { Router, type Request, Response, NextFunction } from "express";
import passport from "./passport-config";
import { storage } from "./storage";
import { sanitizeUser } from "./auth-utils";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Registration schema - validates input
const registerSchema = insertUserSchema.extend({
  role: z.enum(["customer", "admin"]).optional().default("customer"),
});

// POST /api/auth/register - Register a new user
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.parse(req.body);

    // Check if username already exists
    const existingByUsername = await storage.getUserByUsername(parsed.username);
    if (existingByUsername) {
      return res.status(400).json({ 
        message: "Username already exists",
        field: "username" 
      });
    }

    // Check if email already exists
    const existingByEmail = await storage.getUserByEmail(parsed.email);
    if (existingByEmail) {
      return res.status(400).json({ 
        message: "Email already exists",
        field: "email" 
      });
    }

    // Create user (password will be hashed in storage)
    const user = await storage.createUser(parsed);

    // Log the user in automatically
    req.login(sanitizeUser(user), (err) => {
      if (err) {
        return next(err);
      }
      res.status(201).json({
        message: "Registration successful",
        user: sanitizeUser(user),
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
});

// POST /api/auth/login - Login with username and password
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        message: info?.message || "Authentication failed",
      });
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.json({
        message: "Login successful",
        user,
      });
    });
  })(req, res, next);
});

// POST /api/auth/logout - Logout current user
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ message: "Logout successful" });
  });
});

// GET /api/auth/me - Get current authenticated user
router.get("/me", (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      message: "Not authenticated",
      user: null,
    });
  }
  res.json({
    user: req.user,
  });
});

export default router;

