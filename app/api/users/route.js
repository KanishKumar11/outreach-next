import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo";
import { guard } from "@/lib/auth";
import { bad, route, ser, str, USERNAME } from "@/lib/util";
import { ROLES } from "@/lib/perms";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const g = await guard("sa"); if (g.res) return g.res;
  const rows = await (await getDb()).collection("users").find().sort({ createdAt: 1, username: 1 }).toArray();
  return Response.json(rows.map(ser));
});

// Super Admin creates a user with a username, password and role.
export const POST = route(async (req) => {
  const g = await guard("sa"); if (g.res) return g.res;
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80), username = str(b.username, 40).toLowerCase(), password = typeof b.password === "string" ? b.password : "", role = b.role;
  if (!name || !USERNAME.test(username) || password.length < 8 || password.length > 200)
    return bad("Enter a name, a username (3–30 letters, numbers or . _ -) and a password of at least 8 characters.");
  if (!ROLES.includes(role)) return bad("Choose a valid role.");
  const users = (await getDb()).collection("users");
  if (await users.findOne({ username })) return bad("That username already exists.", 409);
  const doc = { username, name, role, status: "active", passHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString().slice(0, 10) };
  const r = await users.insertOne(doc);
  return Response.json(ser({ ...doc, _id: r.insertedId }), { status: 201 });
});
