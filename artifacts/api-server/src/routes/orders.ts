import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  ListOrdersResponse,
  CreateOrderBody,
  GetOrderParams,
  GetOrderResponse,
  UpdateOrderParams,
  UpdateOrderBody,
  UpdateOrderResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    userId: o.userId,
    total: Number(o.total),
    status: o.status,
    items: Array.isArray(o.items) ? o.items : [],
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", async (_req, res): Promise<void> => {
  // EDUCATIONAL NOTE: No user filtering — all orders from all users are returned.
  // Vulnerability: IDOR / Authorization bypass — user sees all orders, not just their own.
  // Secure recommendation: Filter by authenticated user ID unless role is admin.
  const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
  res.json(ListOrdersResponse.parse(orders.map(mapOrder)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const body = CreateOrderBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // EDUCATIONAL NOTE: Price is fetched from DB (good!), but no stock validation.
  // Business logic vulnerability: Order can be placed even if stock is 0.
  // Secure recommendation: Check stock and decrement atomically in a transaction.
  let total = 0;
  const resolvedItems = [];

  for (const item of body.data.items) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, item.productId));

    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }

    const itemTotal = Number(product.price) * item.quantity;
    total += itemTotal;
    resolvedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      price: Number(product.price),
    });
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: 1, // EDUCATIONAL NOTE: Hardcoded user ID — should come from authenticated token
      total: String(total),
      status: "pending",
      items: resolvedItems,
    })
    .returning();

  res.status(201).json(mapOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(mapOrder(order)));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateOrderBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(UpdateOrderResponse.parse(mapOrder(order)));
});

export default router;
