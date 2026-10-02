import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "./mongo";
import { bad } from "./util";
import { can } from "./perms";

const COOKIE = "ot_session";
const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (16+ characters)");
  return new TextEncoder().encode(s);
};

export async function setSession(user) {
  const token = await new SignJWT({ u: user.username }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export const clearSession = () => cookies().set(COOKIE, "", { path: "/", maxAge: 0 });

// Re-checks the user in the database on every request, so deactivation/role changes apply immediately.
export async function currentUser() {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    const u = await (await getDb()).collection("users").findOne({ username: payload.u });
    return u && u.status === "active" ? u : null;
  } catch { return null; }
}
export async function getPerms() {
  const s = await (await getDb()).collection("settings").findOne({ _id: "perms" });
  return (s && s.value) || {};
}
// guard()      -> any signed-in active user
// guard("sa")  -> Super Admin only
// guard(perm)  -> role must hold that permission
export async function guard(perm) {
  const user = await currentUser();
  if (!user) return { res: bad("Not signed in", 401) };
  if (perm === "sa") { if (user.role !== "Super Admin") return { res: bad("Super Admin only", 403) }; }
  else if (perm && !can(user.role, await getPerms(), perm)) return { res: bad("You don't have permission to do that.", 403) };
  return { user };
}
