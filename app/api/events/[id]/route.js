import { getDb, oid } from "@/lib/mongo";
import { guard } from "@/lib/auth";
import { bad, clean, route, ser } from "@/lib/util";
import { TYPES } from "@/lib/cadence";
import { EVENT_FIELDS as FIELDS } from "@/lib/fields";
export const dynamic = "force-dynamic";

export const PATCH = route(async (req, { params }) => {
  const g = await guard("event_edit"); if (g.res) return g.res;
  const _id = oid(params.id); if (!_id) return bad("Invalid id");
  const b = clean(await req.json().catch(() => ({})), FIELDS);
  if ("type" in b && !TYPES[b.type]) b.type = "other";
  if (("title" in b && !b.title) || ("start" in b && !b.start)) return bad("Title and date/time are required.");
  if (!Object.keys(b).length) return bad("Nothing to update.");
  const r = await (await getDb()).collection("events").findOneAndUpdate({ _id }, { $set: b }, { returnDocument: "after" });
  return r ? Response.json(ser(r)) : bad("Event not found.", 404);
});

export const DELETE = route(async (_req, { params }) => {
  const g = await guard("event_delete"); if (g.res) return g.res;
  const _id = oid(params.id); if (!_id) return bad("Invalid id");
  await (await getDb()).collection("events").deleteOne({ _id });
  return Response.json({ ok: true });
});
