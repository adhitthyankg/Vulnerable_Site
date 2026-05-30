import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";

// EDUCATIONAL NOTE: This table stores student-reported vulnerability findings.
// In a real pentest management platform, findings would have stricter access controls —
// only assigned testers could create/edit findings for their scoped engagements.
// Here all authenticated users share a single finding pool to facilitate collaborative
// learning and peer review of discovered vulnerabilities.
export const findingsTable = pgTable("findings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  description: text("description").notNull(),
  affectedEndpoint: text("affected_endpoint").notNull(),
  cweId: text("cwe_id"),
  cvssScore: real("cvss_score"),
  evidence: text("evidence"),
  remediation: text("remediation"),
  userId: integer("user_id").notNull(),
  reportedBy: text("reported_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});
