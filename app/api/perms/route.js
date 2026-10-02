import { getDb } from "@/lib/mongo";
import { guard, getPerms } from "@/lib/auth";
import { route } from "@/lib/util";
import { PERMS } from "@/lib/perms";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const g = await guard(); if (g.res) return g.res;
  return Response.json(await getPerms());
});

// Super Admin saves the permission matrix for Admin / Manager / Member.
export const PUT = route(async (req) => {
  const g = await guard("sa"); if (g.res) return g.res;
  const b = await req.json().catch(() => ({}));
  const out = {};
  for (const r of ["Admin", "Manager", "Member"]) { out[r] = {}; for (const k of Object.keys(PERMS)) out[r][k] = b.perms && b.perms[r] && b.perms[r][k] ? 1 : 0; }
  await (await getDb()).collection("settings").updateOne({ _id: "perms" }, { $set: { value: out } }, { upsert: true });
  return Response.json(out);
});
