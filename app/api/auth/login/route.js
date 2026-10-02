import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo";
import { setSession, getPerms } from "@/lib/auth";
import { bad, route, rl, str, ser } from "@/lib/util";
export const dynamic = "force-dynamic";

const DUMMY = bcrypt.hashSync("not-a-real-password", 12); // equalises timing for unknown usernames

export const POST = route(async (req) => {
  const b = await req.json().catch(() => ({}));
  const username = str(b.username, 40).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  const k = ip + ":" + username;
  if (rl.check(k)) return bad("Too many attempts. Try again in 15 minutes.", 429);

  const user = await (await getDb()).collection("users").findOne({ username });
  const ok = await bcrypt.compare(password, user ? user.passHash : DUMMY);
  if (!user || !ok) { rl.fail(k); return bad("Invalid username or password.", 401); }
  if (user.status === "pending") return bad("Your access request is waiting for approval.", 403);
  if (user.status === "rejected") return bad("Your access request was not approved.", 403);
  if (user.status !== "active") return bad("Your account is deactivated. Contact the Super Admin.", 403);

  rl.clear(k);
  await setSession(user);
  return Response.json({ user: ser(user), perms: await getPerms() });
});
