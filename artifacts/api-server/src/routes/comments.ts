import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, commentsTable } from "@workspace/db";
import {
  ListCommentsResponse,
  ListCommentsQueryParams,
  CreateCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapComment(c: typeof commentsTable.$inferSelect) {
  return {
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    authorName: c.authorName,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/comments", async (req, res): Promise<void> => {
  const query = ListCommentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let comments = await db.select().from(commentsTable).orderBy(commentsTable.createdAt);

  if (query.data.postId) {
    comments = comments.filter(c => c.postId === query.data.postId);
  }

  res.json(ListCommentsResponse.parse(comments.map(mapComment)));
});

router.post("/comments", async (req, res): Promise<void> => {
  const body = CreateCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // EDUCATIONAL NOTE: content is stored as-is and will be rendered in the browser.
  // Vulnerability: Stored XSS (CWE-79) if the frontend renders this as raw HTML.
  // Secure recommendation: Sanitize input server-side (DOMPurify/sanitize-html) AND
  // use text content (not innerHTML) on the frontend.
  const [comment] = await db
    .insert(commentsTable)
    .values({
      postId: body.data.postId,
      authorId: 1,
      authorName: "anonymous",
      content: body.data.content,
    })
    .returning();

  res.status(201).json(mapComment(comment));
});

router.delete("/comments/:id", async (req, res): Promise<void> => {
  const params = DeleteCommentParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // EDUCATIONAL NOTE: No ownership check — any user can delete any comment.
  // Vulnerability: Missing authorization check (IDOR)
  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
