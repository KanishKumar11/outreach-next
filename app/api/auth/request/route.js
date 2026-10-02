import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo";
import { bad, route, rl, str, USERNAME } from "@/lib/util";
export const dynamic = "force-dynamic";

// Public "Request access": creates a pending Member. A Super Admin approves or rejects it in the Team tab.
export const POST = route(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (rl.check("req:" + ip, 5, 36e5)) return bad("Too many requests. Try again later.", 429);
  rl.fail("req:" + ip);

  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80), username = str(b.username, 40).toLowerCase(), password = typeof b.password === "string" ? b.password : "";
  if (!name || !USERNAME.test(username) || password.length < 8 || password.length > 200)
    return bad("Enter your name, a username (3–30 letters, numbers or . _ -) and a password of at least 8 characters.");
  const users = (await getDb()).collection("users");
  if (await users.findOne({ username })) return bad("That username is already taken.", 409);
  await users.insertOne({ username, name, role: "Member", status: "pending", passHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString().slice(0, 10) });
  return Response.json({ ok: true }, { status: 201 });
});
