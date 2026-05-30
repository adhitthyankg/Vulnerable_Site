import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, postsTable } from "@workspace/db";
import {
  ListPostsResponse,
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
  GetPostResponse,
  UpdatePostParams,
  UpdatePostBody,
  UpdatePostResponse,
  DeletePostParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapPost(p: typeof postsTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    authorId: p.authorId,
    authorName: p.authorName,
    category: p.category,
    tags: p.tags ?? [],
    viewCount: p.viewCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString() ?? null,
  };
}

router.get("/posts", async (req, res): Promise<void> => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let posts = await db.select().from(postsTable).orderBy(postsTable.createdAt);

  if (query.data.search) {
    const s = query.data.search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.content.toLowerCase().includes(s)
    );
  }
  if (query.data.category) {
    posts = posts.filter(p => p.category === query.data.category);
  }

  res.json(ListPostsResponse.parse(posts.map(mapPost)));
});

router.post("/posts", async (req, res): Promise<void> => {
  const body = CreatePostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // EDUCATIONAL NOTE: authorId and authorName come from the request body (not verified from token).
  // Vulnerability: CWE-290 - Authentication Bypass by Spoofing.
  // Anyone can post as any user by setting authorId/authorName arbitrarily.
  // Secure recommendation: Always derive author identity from the verified JWT.
  const [post] = await db
    .insert(postsTable)
    .values({
      title: body.data.title,
      content: body.data.content,
      category: body.data.category,
      tags: body.data.tags ?? [],
      authorId: 1,
      authorName: "admin",
      viewCount: 0,
    })
    .returning();

  res.status(201).json(mapPost(post));
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  // Increment view count (intentionally not rate-limited for training purposes)
  await db.update(postsTable).set({ viewCount: post.viewCount + 1 }).where(eq(postsTable.id, post.id));

  res.json(GetPostResponse.parse({ ...mapPost(post), viewCount: post.viewCount + 1 }));
});

router.patch("/posts/:id", async (req, res): Promise<void> => {
  const params = UpdatePostParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdatePostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.title !== undefined) updateData.title = body.data.title;
  if (body.data.content !== undefined) updateData.content = body.data.content;
  if (body.data.category !== undefined) updateData.category = body.data.category;
  if (body.data.tags !== undefined) updateData.tags = body.data.tags;

  const [post] = await db
    .update(postsTable)
    .set(updateData)
    .where(eq(postsTable.id, params.data.id))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(UpdatePostResponse.parse(mapPost(post)));
});

router.delete("/posts/:id", async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
