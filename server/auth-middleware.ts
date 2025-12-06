import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require authentication
 * Ensures user is logged in before proceeding
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }
  next();
}

/**
 * Middleware to require admin role
 * Ensures user is logged in AND has admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  // Check if user has admin role
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

/**
 * Middleware to optionally attach user if authenticated
 * Does not block the request if user is not authenticated
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // User is already attached by passport if authenticated
  // This middleware is just for documentation/clarity
  next();
}

