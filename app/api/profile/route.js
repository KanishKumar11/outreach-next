import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo";
import { guard } from "@/lib/auth";
import { bad, route, ser } from "@/lib/util";
export const dynamic = "force-dynamic";

const IMG = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;

// Signed-in user updates their own photo or password.
export const PATCH = route(async (req) => {
  const g = await guard(); if (g.res) return g.res;
  const b = await req.json().catch(() => ({}));
  const set = {};
  if ("avatar" in b) {
    if (b.avatar !== "" && (typeof b.avatar !== "string" || b.avatar.length > 150000 || !IMG.test(b.avatar))) return bad("Invalid image.");
    set.avatar = b.avatar;
  }
  if ("newPassword" in b) {
    if (typeof b.newPassword !== "string" || b.newPassword.length < 8 || b.newPassword.length > 200) return bad("New password must be at least 8 characters.");
    if (!(await bcrypt.compare(String(b.currentPassword || ""), g.user.passHash))) return bad("Current password is incorrect.", 403);
    set.passHash = await bcrypt.hash(b.newPassword, 12);
  }
  if (!Object.keys(set).length) return bad("Nothing to update.");
  const r = await (await getDb()).collection("users").findOneAndUpdate({ _id: g.user._id }, { $set: set }, { returnDocument: "after" });
  return Response.json(ser(r));
});
