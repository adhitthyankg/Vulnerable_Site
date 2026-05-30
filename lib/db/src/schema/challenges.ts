import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// Static challenge definitions — seeded once, read-only at runtime.
// Each challenge has a flag that students must discover by exploiting the platform.
export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  points: integer("points").notNull().default(100),
  description: text("description").notNull(),
  objectives: jsonb("objectives").notNull().default([]),
  hints: jsonb("hints").notNull().default([]),
  // EDUCATIONAL NOTE: Storing flag hashes not plaintext.
  // Even so, the entire challenges table is returned to any authenticated user
  // without field filtering — demonstrating information disclosure (CWE-200).
  // A secure implementation would never send the flagHash to the client.
  flagHash: text("flag_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Records each user's successful flag submissions.
export const challengeCompletionsTable = pgTable("challenge_completions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  userId: integer("user_id").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

// Tracks all flag submission attempts (correct and incorrect) for analytics.
// EDUCATIONAL NOTE: No rate limiting on submissions — brute-force is possible (CWE-307).
export const challengeAttemptsTable = pgTable("challenge_attempts", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  userId: integer("user_id").notNull(),
  flagSubmitted: text("flag_submitted").notNull(),
  correct: boolean("correct").notNull(),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
});
