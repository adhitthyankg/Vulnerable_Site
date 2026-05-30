import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, apiKeysTable } from "@workspace/db";
import {
  ListApiKeysResponse,
  CreateApiKeyBody,
  DeleteApiKeyParams,
} from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapApiKey(k: typeof apiKeysTable.$inferSelect, fullKey?: string) {
  return {
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    key: fullKey ?? null,
    userId: k.userId,
    isActive: k.isActive,
    lastUsed: k.lastUsed?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  };
}

router.get("/api-keys", async (_req, res): Promise<void> => {
  const keys = await db.select().from(apiKeysTable).orderBy(apiKeysTable.createdAt);
  // EDUCATIONAL NOTE: Key hash is not exposed — good. But no user filtering.
  res.json(ListApiKeysResponse.parse(keys.map(k => mapApiKey(k))));
});

router.post("/api-keys", async (req, res): Promise<void> => {
  const body = CreateApiKeyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // EDUCATIONAL NOTE: Full key shown only at creation time — correct pattern.
  // However, key is stored as a simple hash (SHA-256) without a salt.
  // Vulnerability: If the key space is small, precomputed rainbow table attacks are feasible.
  // Secure recommendation: Use HMAC-SHA256 with a server secret as the hashing key.
  const fullKey = `sk_live_${crypto.randomBytes(32).toString("hex")}`;
  const keyPrefix = fullKey.slice(0, 16);
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

  const [apiKey] = await db
    .insert(apiKeysTable)
    .values({
      name: body.data.name,
      keyPrefix,
      keyHash,
      userId: 1,
      isActive: true,
    })
    .returning();

  res.status(201).json(mapApiKey(apiKey, fullKey));
});

router.delete("/api-keys/:id", async (req, res): Promise<void> => {
  const params = DeleteApiKeyParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(apiKeysTable).where(eq(apiKeysTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
