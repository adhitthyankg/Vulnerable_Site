import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";
import {
  ListEmployeesResponse,
  ListEmployeesQueryParams,
  CreateEmployeeBody,
  GetEmployeeParams,
  GetEmployeeResponse,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  UpdateEmployeeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(String(v), 10);
}

function mapEmployee(e: typeof employeesTable.$inferSelect) {
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    department: e.department,
    role: e.role,
    salary: Number(e.salary),
    hireDate: e.hireDate,
    managerId: e.managerId ?? null,
    phone: e.phone ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/employees", async (req, res): Promise<void> => {
  // EDUCATIONAL NOTE: Salary data exposed to all users without role-based access control.
  // Vulnerability: Sensitive Data Exposure (OWASP A02:2021)
  // Secure recommendation: Strip sensitive fields (salary, SSN) for non-admin roles.
  const query = ListEmployeesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let employees = await db.select().from(employeesTable).orderBy(employeesTable.name);

  if (query.data.search) {
    const s = query.data.search.toLowerCase();
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(s) ||
      e.email.toLowerCase().includes(s) ||
      e.role.toLowerCase().includes(s)
    );
  }
  if (query.data.department) {
    employees = employees.filter(e => e.department === query.data.department);
  }

  res.json(ListEmployeesResponse.parse(employees.map(mapEmployee)));
});

router.post("/employees", async (req, res): Promise<void> => {
  const body = CreateEmployeeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [employee] = await db
    .insert(employeesTable)
    .values({
      name: body.data.name,
      email: body.data.email,
      department: body.data.department,
      role: body.data.role,
      salary: String(body.data.salary),
      hireDate: body.data.hireDate,
      managerId: body.data.managerId,
      phone: body.data.phone,
    })
    .returning();

  res.status(201).json(mapEmployee(employee));
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, params.data.id));
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(GetEmployeeResponse.parse(mapEmployee(employee)));
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse({ id: parseId(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateEmployeeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.email !== undefined) updateData.email = body.data.email;
  if (body.data.department !== undefined) updateData.department = body.data.department;
  if (body.data.role !== undefined) updateData.role = body.data.role;
  if (body.data.salary !== undefined) updateData.salary = String(body.data.salary);
  if (body.data.phone !== undefined) updateData.phone = body.data.phone;

  const [employee] = await db
    .update(employeesTable)
    .set(updateData)
    .where(eq(employeesTable.id, params.data.id))
    .returning();

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(UpdateEmployeeResponse.parse(mapEmployee(employee)));
});

export default router;
