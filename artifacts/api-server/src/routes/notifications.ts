import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (_req, res): Promise<void> => {
  // EDUCATIONAL NOTE: Returns ALL notifications regardless of user.
  // Vulnerability: Authorization bypass — users can see each other's notifications.
  const notifications = await db
    .select()
    .from(notificationsTable)
    .orderBy(notificationsTable.createdAt);
  res.json(ListNotificationsResponse.parse(notifications.map(mapNotification)));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(mapNotification(notification)));
});

export default router;
