import { Router, type IRouter } from "express";
import { db, findingsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

// EDUCATIONAL NOTE: The Security Scanner module demonstrates IDOR (Insecure Direct Object
// Reference — CWE-284). Any authenticated user can view, edit, or delete ANY finding by
// ID — there are no ownership checks. In a real vulnerability management platform, findings
// would be scoped to the user's assigned engagement and role. Secure fix: verify
// req.user.id === finding.userId before allowing modifications.

const router: IRouter = Router();

// OWASP Top 10 2021 categories used for coverage tracking
const OWASP_CATEGORIES = [
  { id: "A01:2021", name: "Broken Access Control", total: 5 },
  { id: "A02:2021", name: "Cryptographic Failures", total: 4 },
  { id: "A03:2021", name: "Injection", total: 6 },
  { id: "A04:2021", name: "Insecure Design", total: 3 },
  { id: "A05:2021", name: "Security Misconfiguration", total: 5 },
  { id: "A06:2021", name: "Vulnerable Components", total: 3 },
  { id: "A07:2021", name: "Auth & Identity Failures", total: 4 },
  { id: "A08:2021", name: "Software & Data Integrity", total: 2 },
  { id: "A09:2021", name: "Security Logging Failures", total: 3 },
  { id: "A10:2021", name: "SSRF", total: 2 },
];

router.get("/findings", async (req, res): Promise<void> => {
  // EDUCATIONAL NOTE: No authorization check here — all users see all findings.
  // This intentionally leaks findings submitted by other students, demonstrating
  // insufficient access control (CWE-284). Secure fix: filter by userId or role.
  const allFindings = await db.select().from(findingsTable).orderBy(findingsTable.createdAt);

  const { severity, status, category } = req.query as Record<string, string>;
  let result = allFindings;
  if (severity) result = result.filter((f) => f.severity === severity);
  if (status) result = result.filter((f) => f.status === status);
  if (category) result = result.filter((f) => f.category.includes(category));

  const mapped = result.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt?.toISOString() ?? null,
  }));

  res.json(mapped);
});

router.get("/scanner/summary", async (_req, res): Promise<void> => {
  const allFindings = await db.select().from(findingsTable);

  const totalFindings = allFindings.length;
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const mediumCount = allFindings.filter((f) => f.severity === "medium").length;
  const lowCount = allFindings.filter((f) => f.severity === "low").length;
  const openCount = allFindings.filter((f) => f.status === "open").length;
  const confirmedCount = allFindings.filter((f) => f.status === "confirmed").length;
  const falsePositiveCount = allFindings.filter((f) => f.status === "false-positive").length;

  const owaspCoverage = OWASP_CATEGORIES.map((cat) => {
    const found = allFindings.filter((f) => f.category === cat.id || f.category === cat.name).length;
    return {
      category: cat.name,
      found,
      total: cat.total,
      percentage: Math.round((Math.min(found, cat.total) / cat.total) * 100),
    };
  });

  res.json({
    totalFindings,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    openCount,
    confirmedCount,
    falsePositiveCount,
    owaspCoverage,
  });
});

router.post("/findings", async (req, res): Promise<void> => {
  // EDUCATIONAL NOTE: No input sanitization on description/evidence fields —
  // stored XSS risk (CWE-79). If this content were rendered without escaping
  // it could execute attacker-controlled scripts. React escapes by default,
  // but dangerouslySetInnerHTML or markdown renderers would be vulnerable.
  const { title, category, severity, description, affectedEndpoint, cweId, cvssScore, evidence, remediation } = req.body as Record<string, unknown>;

  const user = (req as unknown as { user?: { id: number; username: string } }).user;
  const userId = user?.id ?? 0;
  const reportedBy = user?.username ?? "anonymous";

  const [created] = await db
    .insert(findingsTable)
    .values({
      title: title as string,
      category: category as string,
      severity: (severity as string) ?? "medium",
      status: "open",
      description: description as string,
      affectedEndpoint: affectedEndpoint as string,
      cweId: (cweId as string) ?? null,
      cvssScore: cvssScore ? Number(cvssScore) : null,
      evidence: (evidence as string) ?? null,
      remediation: (remediation as string) ?? null,
      userId,
      reportedBy,
    })
    .returning();

  res.status(201).json({
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt?.toISOString() ?? null,
  });
});

router.get("/findings/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [finding] = await db.select().from(findingsTable).where(eq(findingsTable.id, id));
  if (!finding) {
    res.status(404).json({ error: "Finding not found" });
    return;
  }
  res.json({ ...finding, createdAt: finding.createdAt.toISOString(), updatedAt: finding.updatedAt?.toISOString() ?? null });
});

router.patch("/findings/:id", async (req, res): Promise<void> => {
  // EDUCATIONAL NOTE: IDOR — no check that the requester owns this finding.
  // Any user with a valid session token can update any finding by ID.
  const id = Number(req.params.id);
  const updates = req.body as Record<string, unknown>;

  const allowedFields: Record<string, unknown> = {};
  const fieldMap: Record<string, string> = {
    title: "title",
    category: "category",
    severity: "severity",
    status: "status",
    description: "description",
    affectedEndpoint: "affectedEndpoint",
    cweId: "cweId",
    cvssScore: "cvssScore",
    evidence: "evidence",
    remediation: "remediation",
  };
  for (const key of Object.keys(updates)) {
    if (fieldMap[key]) allowedFields[fieldMap[key] as keyof typeof allowedFields] = updates[key];
  }

  const [updated] = await db
    .update(findingsTable)
    .set({ ...allowedFields, updatedAt: new Date() })
    .where(eq(findingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Finding not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt?.toISOString() ?? null });
});

router.delete("/findings/:id", async (req, res): Promise<void> => {
  // EDUCATIONAL NOTE: IDOR — no ownership check. Any user can delete any finding.
  const id = Number(req.params.id);
  await db.delete(findingsTable).where(eq(findingsTable.id, id));
  res.status(204).send();
});

export default router;
