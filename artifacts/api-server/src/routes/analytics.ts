import { Router, type IRouter } from "express";
import { db, usersTable, productsTable, ordersTable, ticketsTable, postsTable, uploadsTable, employeesTable, auditLogsTable } from "@workspace/db";
import { count, sum, eq } from "drizzle-orm";
import {
  GetAnalyticsSummaryResponse,
  GetRecentActivityResponse,
  GetVulnerabilityStatsResponse,
  GetUserStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [activeUserCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isActive, true));
  const [orderCount] = await db.select({ count: count() }).from(ordersTable);
  const [ticketRows] = await db.select({ count: count() }).from(ticketsTable).where(eq(ticketsTable.status, "open"));
  const [postCount] = await db.select({ count: count() }).from(postsTable);
  const [uploadCount] = await db.select({ count: count() }).from(uploadsTable);
  const [employeeCount] = await db.select({ count: count() }).from(employeesTable);

  const orders = await db.select().from(ordersTable);
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  res.json(GetAnalyticsSummaryResponse.parse({
    totalUsers: userCount.count,
    activeUsers: activeUserCount.count,
    totalOrders: orderCount.count,
    totalRevenue,
    openTickets: ticketRows.count,
    totalPosts: postCount.count,
    totalUploads: uploadCount.count,
    totalEmployees: employeeCount.count,
  }));
});

router.get("/analytics/activity", async (_req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(auditLogsTable.createdAt)
    .limit(20);

  const activity = logs.map(l => ({
    id: l.id,
    type: l.action,
    message: `${l.username} ${l.action} on ${l.resource}: ${l.details}`,
    username: l.username,
    timestamp: l.createdAt.toISOString(),
  }));

  res.json(activity);
});

router.get("/analytics/vulnerabilities", async (_req, res): Promise<void> => {
  // Static vulnerability stats for the training dashboard
  const stats = [
    { category: "Injection", count: 12, severity: "critical", description: "SQL, NoSQL, OS command injection flaws" },
    { category: "Broken Auth", count: 9, severity: "critical", description: "Authentication and session management failures" },
    { category: "XSS", count: 15, severity: "high", description: "Cross-site scripting via stored/reflected/DOM" },
    { category: "IDOR", count: 7, severity: "high", description: "Insecure direct object reference exposures" },
    { category: "CSRF", count: 4, severity: "medium", description: "Cross-site request forgery gaps" },
    { category: "Sensitive Data", count: 6, severity: "high", description: "Unprotected sensitive data exposure" },
    { category: "Broken Access Control", count: 11, severity: "critical", description: "Missing function-level access control" },
    { category: "Security Misconfig", count: 8, severity: "medium", description: "Misconfigured security headers and CORS" },
    { category: "Insecure Upload", count: 5, severity: "high", description: "Unrestricted file type upload vulnerabilities" },
    { category: "Business Logic", count: 3, severity: "medium", description: "Business logic abuse scenarios" },
  ];

  res.json(stats);
});

router.get("/analytics/user-stats", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);

  const monthCounts: Record<string, number> = {};
  for (const user of users) {
    const month = user.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    monthCounts[month] = (monthCounts[month] ?? 0) + 1;
  }

  // Fill in the last 6 months even if empty
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    if (!monthCounts[key]) monthCounts[key] = 0;
  }

  const stats = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  res.json(stats);
});

export default router;
