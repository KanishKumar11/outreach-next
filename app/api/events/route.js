import { getDb } from "@/lib/mongo";
import { guard } from "@/lib/auth";
import { bad, clean, route, ser } from "@/lib/util";
import { TYPES } from "@/lib/cadence";
export const dynamic = "force-dynamic";

import { EVENT_FIELDS as FIELDS } from "@/lib/fields";

export const GET = route(async () => {
  const g = await guard(); if (g.res) return g.res;
  const rows = await (await getDb()).collection("events").find().sort({ start: 1 }).limit(5000).toArray();
  return Response.json(rows.map(ser));
});

export const POST = route(async (req) => {
  const g = await guard("event_create"); if (g.res) return g.res;
  const b = clean(await req.json().catch(() => ({})), FIELDS);
  if (!b.title || !b.start) return bad("Title and date/time are required.");
  if (!TYPES[b.type]) b.type = "other";
  const doc = { ...b, by: g.user.username };
  const r = await (await getDb()).collection("events").insertOne(doc);
  return Response.json(ser({ ...doc, _id: r.insertedId }), { status: 201 });
});
