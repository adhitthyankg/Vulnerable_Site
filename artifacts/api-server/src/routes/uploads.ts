import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, uploadsTable } from "@workspace/db";
import {
  ListUploadsResponse,
  CreateUploadBody,
  DeleteUploadParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapUpload(u: typeof uploadsTable.$inferSelect) {
  return {
    id: u.id,
    filename: u.filename,
    originalName: u.originalName,
    mimeType: u.mimeType,
    size: u.size,
    userId: u.userId,
    path: u.path ?? "",
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/uploads", async (_req, res): Promise<void> => {
  const uploads = await db.select().from(uploadsTable).orderBy(uploadsTable.createdAt);
  res.json(ListUploadsResponse.parse(uploads.map(mapUpload)));
});

router.post("/uploads", async (req, res): Promise<void> => {
  const body = CreateUploadBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // EDUCATIONAL NOTE: File type is taken directly from the client request without server-side validation.
  // Vulnerability: CWE-434 - Unrestricted Upload of File with Dangerous Type
  // The mimeType, originalName, and path fields are entirely client-controlled.
  // Secure recommendation: Use server-side magic byte detection (file-type package),
  // validate extensions against an allowlist, and store files outside web root.
  const [upload] = await db
    .insert(uploadsTable)
    .values({
      filename: body.data.filename,
      originalName: body.data.originalName,
      mimeType: body.data.mimeType,
      size: body.data.size,
      userId: 1,
      path: body.data.path ?? `/uploads/${body.data.filename}`,
    })
    .returning();

  res.status(201).json(mapUpload(upload));
});

router.delete("/uploads/:id", async (req, res): Promise<void> => {
  const params = DeleteUploadParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(uploadsTable).where(eq(uploadsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
