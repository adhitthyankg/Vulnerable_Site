import { db, usersTable, productsTable, postsTable, commentsTable, ticketsTable, employeesTable, notificationsTable, challengesTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  const [admin] = await db.insert(usersTable).values({
    username: "admin",
    email: "admin@cyberlab.local",
    password: hashPassword("admin123"),
    role: "admin",
    isActive: true,
  }).returning();

  const [test] = await db.insert(usersTable).values({
    username: "test",
    email: "test@cyberlab.local",
    password: hashPassword("test123"),
    role: "user",
    isActive: true,
  }).returning();

  const [analyst] = await db.insert(usersTable).values({
    username: "analyst",
    email: "analyst@cyberlab.local",
    password: hashPassword("password123"),
    role: "analyst",
    isActive: true,
  }).returning();

  console.log("Created users:", admin.username, test.username, analyst.username);

  await db.insert(productsTable).values([
    { name: "Laptop Pro 16", description: "High-performance laptop for developers", price: "1999.99", category: "Electronics", stock: 15 },
    { name: "Wireless Mouse", description: "Ergonomic wireless mouse", price: "49.99", category: "Accessories", stock: 50 },
    { name: "Mechanical Keyboard", description: "RGB mechanical keyboard", price: "149.99", category: "Accessories", stock: 30 },
    { name: "USB-C Hub", description: "7-in-1 USB-C hub", price: "39.99", category: "Accessories", stock: 100 },
    { name: "27\" 4K Monitor", description: "Ultra-sharp 4K monitor", price: "499.99", category: "Electronics", stock: 10 },
    { name: "Webcam HD", description: "1080p webcam with microphone", price: "79.99", category: "Electronics", stock: 25 },
    { name: "Noise Canceling Headphones", description: "Over-ear Bluetooth headphones", price: "299.99", category: "Audio", stock: 20 },
    { name: "Portable SSD 1TB", description: "Fast external SSD storage", price: "129.99", category: "Storage", stock: 40 },
  ]);

  console.log("Created products");

  const [post1] = await db.insert(postsTable).values({
    title: "Getting Started with Web Security Testing",
    content: "Web security testing is a critical skill for any developer. In this post, we'll explore the basics of identifying common vulnerabilities in web applications...",
    authorId: admin.id,
    authorName: "admin",
    category: "security",
    tags: ["security", "web", "beginners"],
    viewCount: 42,
  }).returning();

  const [post2] = await db.insert(postsTable).values({
    title: "Understanding SQL Injection",
    content: "SQL Injection (CWE-89) remains one of the most dangerous web vulnerabilities. This post explains how it works and how to prevent it using parameterized queries...",
    authorId: admin.id,
    authorName: "admin",
    category: "security",
    tags: ["sql-injection", "database", "security"],
    viewCount: 78,
  }).returning();

  const [post3] = await db.insert(postsTable).values({
    title: "API Security Best Practices",
    content: "REST APIs are the backbone of modern web applications. Here are essential security practices every API developer should follow...",
    authorId: analyst.id,
    authorName: "analyst",
    category: "development",
    tags: ["api", "security", "best-practices"],
    viewCount: 56,
  }).returning();

  const [post4] = await db.insert(postsTable).values({
    title: "Company Announcement: New Platform Launch",
    content: "We are excited to announce the launch of our new cybersecurity training platform. Stay tuned for more updates...",
    authorId: admin.id,
    authorName: "admin",
    category: "announcements",
    tags: ["announcement", "platform"],
    viewCount: 120,
  }).returning();

  console.log("Created posts");

  await db.insert(commentsTable).values([
    { postId: post1.id, authorId: test.id, authorName: "test", content: "Great introduction! I learned a lot." },
    { postId: post1.id, authorId: analyst.id, authorName: "analyst", content: "Well written. Looking forward to more advanced topics." },
    { postId: post2.id, authorId: test.id, authorName: "test", content: "Can you show more examples of parameterized queries?" },
    { postId: post3.id, authorId: admin.id, authorName: "admin", content: "Excellent post! I'd add that rate limiting is also crucial." },
  ]);

  console.log("Created comments");

  await db.insert(ticketsTable).values([
    { title: "Cannot access admin dashboard", description: "I keep getting a 403 error when trying to access /admin", status: "open", priority: "high", userId: test.id },
    { title: "Feature request: Dark mode", description: "Would love to see a dark mode option for the platform", status: "open", priority: "low", userId: analyst.id },
    { title: "Bug: Login page not loading", description: "The login page sometimes hangs on Chrome", status: "in_progress", priority: "medium", userId: test.id, assignedTo: admin.id },
  ]);

  console.log("Created tickets");

  await db.insert(employeesTable).values([
    { name: "Alice Johnson", email: "alice@cyberlab.local", department: "Engineering", role: "Senior Developer", salary: "120000", hireDate: "2023-01-15", phone: "555-0101" },
    { name: "Bob Smith", email: "bob@cyberlab.local", department: "Security", role: "Security Analyst", salary: "95000", hireDate: "2023-03-20", phone: "555-0102" },
    { name: "Carol Williams", email: "carol@cyberlab.local", department: "HR", role: "HR Manager", salary: "85000", hireDate: "2022-06-01", phone: "555-0103" },
    { name: "Dave Brown", email: "dave@cyberlab.local", department: "Engineering", role: "Junior Developer", salary: "70000", hireDate: "2024-02-10", phone: "555-0104", managerId: 1 },
    { name: "Eve Davis", email: "eve@cyberlab.local", department: "Marketing", role: "Marketing Lead", salary: "90000", hireDate: "2023-09-05", phone: "555-0105" },
  ]);

  console.log("Created employees");

  await db.insert(notificationsTable).values([
    { userId: admin.id, title: "New user registered", message: "A new user has registered to the platform", type: "info" },
    { userId: admin.id, title: "Server maintenance", message: "Scheduled maintenance at 2 AM tomorrow", type: "warning" },
    { userId: test.id, title: "Welcome to CyberLab", message: "Thank you for joining the platform!", type: "success" },
    { userId: analyst.id, title: "New challenge available", message: "A new XSS challenge has been added", type: "info" },
  ]);

  console.log("Created notifications");

  await db.insert(challengesTable).values([
    {
      title: "SQL Injection Discovery",
      category: "injection",
      difficulty: "easy",
      points: 100,
      description: "Find the SQL injection vulnerability in the product search and extract hidden data from the database.",
      objectives: ["Identify the vulnerable endpoint", "Extract all usernames from the database", "Retrieve the flag from the admin account"],
      hints: ["Try single quote in the search field", "Look at the UNION keyword", "The users table contains what you need"],
      flagHash: crypto.createHash("sha256").update("flag{sql_injection_master}").digest("hex"),
      isActive: true,
    },
    {
      title: "Cross-Site Scripting (XSS)",
      category: "xss",
      difficulty: "medium",
      points: 200,
      description: "Exploit a stored XSS vulnerability in the blog post comments section to steal an admin's session.",
      objectives: ["Find the stored XSS location", "Craft a working XSS payload", "Execute JavaScript in the admin's browser"],
      hints: ["Check the comments field", "Look at how comments are rendered", "Use <script>alert(1)</script> to test"],
      flagHash: crypto.createHash("sha256").update("flag{xss_exploiter}").digest("hex"),
      isActive: true,
    },
    {
      title: "Broken Access Control",
      category: "access-control",
      difficulty: "medium",
      points: 200,
      description: "Exploit a broken access control vulnerability to access another user's order details.",
      objectives: ["Identify the IDOR vulnerability", "Access order information belonging to another user", "Extract the sensitive data from the order"],
      hints: ["Look at URL parameters", "Try changing the order ID", "Orders have sequential IDs"],
      flagHash: crypto.createHash("sha256").update("flag{idor_expert}").digest("hex"),
      isActive: true,
    },
    {
      title: "Mass Assignment Attack",
      category: "misconfiguration",
      difficulty: "easy",
      points: 100,
      description: "Register a new account and escalate your privileges to admin using a mass assignment vulnerability.",
      objectives: ["Register a new account", "Escalate privileges to admin", "Access the admin dashboard"],
      hints: ["Check the registration request body", "Look for extra fields in the API", "Try adding role: admin to your registration"],
      flagHash: crypto.createHash("sha256").update("flag{mass_assignment_hacker}").digest("hex"),
      isActive: true,
    },
  ]);

  console.log("Created challenges");

  console.log("Database seeded successfully!");
  console.log("\nDemo credentials:");
  console.log("  admin | admin123 | admin");
  console.log("  test  | test123  | user");
  console.log("  analyst | password123 | analyst");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
