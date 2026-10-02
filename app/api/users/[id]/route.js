import bcrypt from "bcryptjs";
import { getDb, oid } from "@/lib/mongo";
import { guard } from "@/lib/auth";
import { bad, route, ser, str } from "@/lib/util";
import { ROLES } from "@/lib/perms";
export const dynamic = "force-dynamic";

const STATES = ["active", "inactive", "pending", "rejected"];

export const PATCH = route(async (req, { params }) => {
  const g = await guard("sa"); if (g.res) return g.res;
  const _id = oid(params.id); if (!_id) return bad("Invalid id");
  const b = await req.json().catch(() => ({}));
  const set = {};
  if ("role" in b) { if (!ROLES.includes(b.role)) return bad("Invalid role."); set.role = b.role; }
  if ("status" in b) { if (!STATES.includes(b.status)) return bad("Invalid status."); set.status = b.status; }
  if ("name" in b) { const n = str(b.name, 80); if (!n) return bad("Name is required."); set.name = n; }
  if ("password" in b) {
    if (typeof b.password !== "string" || b.password.length < 8 || b.password.length > 200) return bad("Password must be at least 8 characters.");
    set.passHash = await bcrypt.hash(b.password, 12);
  }
  const self = String(_id) === String(g.user._id);
  if (self && ((set.role && set.role !== "Super Admin") || (set.status && set.status !== "active"))) return bad("You can't change your own role or status.");
  if (!Object.keys(set).length) return bad("Nothing to update.");
  const r = await (await getDb()).collection("users").findOneAndUpdate({ _id }, { $set: set }, { returnDocument: "after" });
  return r ? Response.json(ser(r)) : bad("User not found.", 404);
});

export const DELETE = route(async (_req, { params }) => {
  const g = await guard("sa"); if (g.res) return g.res;
  const _id = oid(params.id); if (!_id) return bad("Invalid id");
  if (String(_id) === String(g.user._id)) return bad("You can't remove your own account.");
  await (await getDb()).collection("users").deleteOne({ _id });
  return Response.json({ ok: true });
});
