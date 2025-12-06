import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { verifyPassword, sanitizeUser } from "./auth-utils";
import type { User } from "@shared/schema";

// Configure passport to use local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Return user without password
        return done(null, sanitizeUser(user));
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    // Return user without password
    done(null, sanitizeUser(user));
  } catch (error) {
    done(error);
  }
});

export default passport;

