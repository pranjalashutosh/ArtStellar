import type { User as DbUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      role: "customer" | "admin";
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

export {};

