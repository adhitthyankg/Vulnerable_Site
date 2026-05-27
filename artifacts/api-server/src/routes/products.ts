import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  ListProductsResponse,
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: Number(p.price),
    category: p.category,
    stock: p.stock,
    imageUrl: p.imageUrl ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let products = await db.select().from(productsTable).orderBy(productsTable.createdAt);

  // EDUCATIONAL NOTE: Search filtering done in application layer (not DB) to demonstrate
  // that client-provided search parameters can expose unexpected data if not filtered correctly.
  // Vulnerability: Mass data exposure if pagination/filtering is bypassed.
  // Secure recommendation: Use DB-level filtering with parameterized queries + proper pagination.
  if (query.data.search) {
    const s = query.data.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.description ?? "").toLowerCase().includes(s)
    );
  }
  if (query.data.category) {
    products = products.filter(p => p.category === query.data.category);
  }

  res.json(ListProductsResponse.parse(products.map(mapProduct)));
});

router.post("/products", async (req, res): Promise<void> => {
  const body = CreateProductBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      name: body.data.name,
      description: body.data.description,
      price: String(body.data.price),
      category: body.data.category,
      stock: body.data.stock,
      imageUrl: body.data.imageUrl,
    })
    .returning();

  res.status(201).json(mapProduct(product));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(mapProduct(product)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateProductBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.price !== undefined) updateData.price = String(body.data.price);
  if (body.data.category !== undefined) updateData.category = body.data.category;
  if (body.data.stock !== undefined) updateData.stock = body.data.stock;
  if (body.data.imageUrl !== undefined) updateData.imageUrl = body.data.imageUrl;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(mapProduct(product)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
