import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ticketsTable } from "@workspace/db";
import {
  ListTicketsResponse,
  CreateTicketBody,
  GetTicketParams,
  GetTicketResponse,
  UpdateTicketParams,
  UpdateTicketBody,
  UpdateTicketResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapTicket(t: typeof ticketsTable.$inferSelect) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    userId: t.userId,
    assignedTo: t.assignedTo ?? null,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/tickets", async (_req, res): Promise<void> => {
  const tickets = await db.select().from(ticketsTable).orderBy(ticketsTable.createdAt);
  res.json(ListTicketsResponse.parse(tickets.map(mapTicket)));
});

router.post("/tickets", async (req, res): Promise<void> => {
  const body = CreateTicketBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [ticket] = await db
    .insert(ticketsTable)
    .values({
      title: body.data.title,
      description: body.data.description,
      priority: body.data.priority,
      status: "open",
      userId: 1,
    })
    .returning();

  res.status(201).json(mapTicket(ticket));
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const params = GetTicketParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, params.data.id));
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(GetTicketResponse.parse(mapTicket(ticket)));
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const params = UpdateTicketParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateTicketBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.status !== undefined) {
    updateData.status = body.data.status;
    if (body.data.status === "resolved") {
      updateData.resolvedAt = new Date();
    }
  }
  if (body.data.priority !== undefined) updateData.priority = body.data.priority;
  if (body.data.assignedTo !== undefined) updateData.assignedTo = body.data.assignedTo;

  const [ticket] = await db
    .update(ticketsTable)
    .set(updateData)
    .where(eq(ticketsTable.id, params.data.id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(UpdateTicketResponse.parse(mapTicket(ticket)));
});

export default router;
