import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  LoginBody,
  RegisterBody,
  GetMeResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  // EDUCATIONAL NOTE: This uses a weak unsalted SHA-256 hash.
  // Vulnerability: CWE-916 - Use of Password Hash With Insufficient Computational Effort
  // Secure recommendation: Use bcrypt/argon2 with a random salt per user.
  // Defensive remediation: import bcrypt; bcrypt.hash(password, 12)
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(userId: number, username: string, role: string): string {
  // EDUCATIONAL NOTE: This creates a predictable "token" using base64 encoding.
  // Vulnerability: CWE-330 - Use of Insufficiently Random Values
  // A real JWT should be signed with a strong secret and include expiry.
  // Secure recommendation: Use jsonwebtoken with HS256 + short expiry + refresh tokens.
  const payload = JSON.stringify({ userId, username, role, iat: Date.now() });
  return Buffer.from(payload).toString("base64");
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  // EDUCATIONAL NOTE: This query is intentionally written to be inspectable.
  // In a vulnerable version, string interpolation here would allow SQL injection.
  // Secure pattern: Always use parameterized queries (Drizzle does this automatically).
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user || user.password !== hashPassword(password)) {
    // EDUCATIONAL NOTE: Generic error prevents username enumeration attacks.
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Account disabled" });
    return;
  }

  // Update last login
  await db
    .update(usersTable)
    .set({ lastLogin: new Date() })
    .where(eq(usersTable.id, user.id));

  const token = generateToken(user.id, user.username, user.role);

  req.log.info({ userId: user.id, username: user.username }, "User logged in");

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, email, password, role } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existing) {
    res.status(400).json({ error: "Username already exists" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      email,
      password: hashPassword(password),
      // EDUCATIONAL NOTE: Mass assignment vulnerability — role is accepted from user input.
      // Vulnerability: CWE-915 - Improperly Controlled Modification of Dynamically-Determined Object Attributes
      // Secure recommendation: Never accept role from client. Default to "user" always.
      role: role ?? "user",
    })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  const token = generateToken(user.id, user.username, user.role);

  req.log.info({ userId: user.id }, "User registered");

  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: null,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  // EDUCATIONAL NOTE: This stateless "logout" doesn't invalidate the token server-side.
  // Vulnerability: Token remains valid until expiry. If stolen, cannot be revoked.
  // Secure recommendation: Maintain a token blacklist (Redis) or use short-lived JWTs + refresh token rotation.
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as { userId: number };

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json(GetMeResponse.parse({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    }));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
