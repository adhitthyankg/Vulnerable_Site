import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import {
  ListAuditLogsResponse,
  ListAuditLogsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapAuditLog(l: typeof auditLogsTable.$inferSelect) {
  return {
    id: l.id,
    userId: l.userId,
    username: l.username,
    action: l.action,
    resource: l.resource,
    details: l.details,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  };
}

router.get("/audit-logs", async (req, res): Promise<void> => {
  // EDUCATIONAL NOTE: Audit logs accessible without admin role verification.
  // Vulnerability: Information disclosure — logs contain IP addresses, user actions, sensitive details.
  // Secure recommendation: Restrict audit log access to admin/security roles only.
  const query = ListAuditLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let logs = await db.select().from(auditLogsTable).orderBy(auditLogsTable.createdAt);

  if (query.data.userId) {
    logs = logs.filter(l => l.userId === query.data.userId);
  }
  if (query.data.action) {
    logs = logs.filter(l => l.action.toLowerCase().includes(query.data.action!.toLowerCase()));
  }

  res.json(ListAuditLogsResponse.parse(logs.map(mapAuditLog)));
});

export default router;
