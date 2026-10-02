import { getDb } from "@/lib/mongo";
import { guard } from "@/lib/auth";
import { bad, clean, route, ser } from "@/lib/util";
import { STATUS, iso } from "@/lib/cadence";
export const dynamic = "force-dynamic";

import { PROSPECT_FIELDS as FIELDS } from "@/lib/fields";

export const GET = route(async () => {
  const g = await guard(); if (g.res) return g.res;
  const rows = await (await getDb()).collection("prospects").find().sort({ createdAt: -1 }).limit(5000).toArray();
  return Response.json(rows.map(ser));
});

export const POST = route(async (req) => {
  const g = await guard("prospect_add"); if (g.res) return g.res;
  const b = clean(await req.json().catch(() => ({})), FIELDS);
  if (!b.name) return bad("Name is required.");
  if (!STATUS[b.status]) b.status = "identified";
  const today = iso(new Date());
  const doc = { ...b, followUps: b.followUps || 0, lastActionDate: b.lastActionDate || today, createdAt: today, createdBy: g.user.username };
  const r = await (await getDb()).collection("prospects").insertOne(doc);
  return Response.json(ser({ ...doc, _id: r.insertedId }), { status: 201 });
});
