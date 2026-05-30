import { Router, type IRouter } from "express";
import { db, challengesTable, challengeCompletionsTable, challengeAttemptsTable } from "@workspace/db";
import { eq, and, count, sum } from "drizzle-orm";
import crypto from "crypto";

// EDUCATIONAL NOTE: The challenges module intentionally omits rate limiting on
// flag submissions (CWE-307). A real CTF platform would throttle submission
// attempts per user+challenge to prevent brute-force enumeration of flags.
// It also exposes the flagHash in the DB schema — though not returned to clients
// here, a SQL injection on another endpoint could leak it (CWE-200).

const router: IRouter = Router();

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim().toLowerCase()).digest("hex");
}

function getUserFromReq(req: unknown): { id: number; username: string; role: string } | null {
  return (req as { user?: { id: number; username: string; role: string } }).user ?? null;
}

// Ranks based on total points
function getRank(points: number): string {
  if (points >= 2000) return "ELITE";
  if (points >= 1200) return "EXPERT";
  if (points >= 700) return "ADVANCED";
  if (points >= 300) return "INTERMEDIATE";
  if (points >= 100) return "NOVICE";
  return "RECRUIT";
}

router.get("/challenges", async (req, res): Promise<void> => {
  const user = getUserFromReq(req);
  const userId = user?.id ?? 0;

  const challenges = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.isActive, true))
    .orderBy(challengesTable.id);

  const completions = userId
    ? await db.select().from(challengeCompletionsTable).where(eq(challengeCompletionsTable.userId, userId))
    : [];

  const allCompletions = await db.select({ challengeId: challengeCompletionsTable.challengeId })
    .from(challengeCompletionsTable);

  const solvedCounts: Record<number, number> = {};
  for (const c of allCompletions) {
    solvedCounts[c.challengeId] = (solvedCounts[c.challengeId] ?? 0) + 1;
  }

  const completedIds = new Set(completions.map((c) => c.challengeId));

  const result = challenges.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    points: c.points,
    description: c.description,
    completed: completedIds.has(c.id),
    completedAt: completions.find((cp) => cp.challengeId === c.id)?.completedAt.toISOString() ?? null,
    solvedCount: solvedCounts[c.id] ?? 0,
    totalAttempts: 0,
  }));

  res.json(result);
});

router.get("/challenges/progress/me", async (req, res): Promise<void> => {
  const user = getUserFromReq(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const completions = await db
    .select()
    .from(challengeCompletionsTable)
    .where(eq(challengeCompletionsTable.userId, user.id));

  const totalPoints = completions.reduce((acc, c) => acc + c.pointsEarned, 0);
  const totalChallenges = await db.select({ count: count() }).from(challengesTable).where(eq(challengesTable.isActive, true));

  res.json({
    totalPoints,
    completedCount: completions.length,
    totalChallenges: totalChallenges[0]?.count ?? 0,
    rank: getRank(totalPoints),
    completions: completions.map((c) => ({
      challengeId: c.challengeId,
      completedAt: c.completedAt.toISOString(),
      pointsEarned: c.pointsEarned,
    })),
  });
});

router.get("/challenges/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const user = getUserFromReq(req);
  const userId = user?.id ?? 0;

  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, id));
  if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

  const completion = userId
    ? await db.select().from(challengeCompletionsTable)
        .where(and(eq(challengeCompletionsTable.challengeId, id), eq(challengeCompletionsTable.userId, userId)))
    : [];

  const [solvedRow] = await db.select({ count: count() }).from(challengeCompletionsTable)
    .where(eq(challengeCompletionsTable.challengeId, id));

  res.json({
    id: challenge.id,
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    points: challenge.points,
    description: challenge.description,
    objectives: challenge.objectives as string[],
    hints: challenge.hints as { order: number; text: string; penaltyPoints: number }[],
    completed: completion.length > 0,
    completedAt: completion[0]?.completedAt.toISOString() ?? null,
    solvedCount: solvedRow?.count ?? 0,
    totalAttempts: 0,
  });
});

router.post("/challenges/:id/submit", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const user = getUserFromReq(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { flag } = req.body as { flag?: string };
  if (!flag) { res.status(400).json({ error: "flag is required" }); return; }

  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, id));
  if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

  // Check already completed
  const existing = await db.select().from(challengeCompletionsTable)
    .where(and(eq(challengeCompletionsTable.challengeId, id), eq(challengeCompletionsTable.userId, user.id)));
  if (existing.length > 0) {
    res.json({ correct: true, message: "ALREADY_SOLVED — you have already completed this challenge.", pointsEarned: 0, totalPoints: null });
    return;
  }

  const submittedHash = hashFlag(flag);
  const correct = submittedHash === challenge.flagHash;

  // Record attempt
  await db.insert(challengeAttemptsTable).values({
    challengeId: id,
    userId: user.id,
    flagSubmitted: flag,  // EDUCATIONAL NOTE: storing raw submitted flags in plaintext (CWE-312)
    correct,
  });

  if (correct) {
    await db.insert(challengeCompletionsTable).values({
      challengeId: id,
      userId: user.id,
      pointsEarned: challenge.points,
    });

    const allCompletions = await db.select()
      .from(challengeCompletionsTable)
      .where(eq(challengeCompletionsTable.userId, user.id));
    const totalPoints = allCompletions.reduce((acc, c) => acc + c.pointsEarned, 0);

    res.json({
      correct: true,
      message: `FLAG_ACCEPTED — +${challenge.points} points. ${getRank(totalPoints)} rank achieved.`,
      pointsEarned: challenge.points,
      totalPoints,
    });
  } else {
    res.json({ correct: false, message: "INCORRECT_FLAG — try again.", pointsEarned: null, totalPoints: null });
  }
});

export default router;
