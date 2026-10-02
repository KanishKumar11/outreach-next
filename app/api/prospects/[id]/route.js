import { getDb, oid } from "@/lib/mongo";
import { guard } from "@/lib/auth";
import { bad, clean, route, ser } from "@/lib/util";
import { STATUS } from "@/lib/cadence";
import { PROSPECT_FIELDS as FIELDS } from "@/lib/fields";
export const dynamic = "force-dynamic";

export const PATCH = route(async (req, { params }) => {
  const g = await guard("prospect_edit"); if (g.res) return g.res;
  const _id = oid(params.id); if (!_id) return bad("Invalid id");
  const b = clean(await req.json().catch(() => ({})), FIELDS);
  if ("status" in b && !STATUS[b.status]) delete b.status;
  if ("name" in b && !b.name) return bad("Name is required.");
  if (!Object.keys(b).length) return bad("Nothing to update.");
  const r = await (await getDb()).collection("prospects").findOneAndUpdate({ _id }, { $set: b }, { returnDocument: "after" });
  return r ? Response.json(ser(r)) : bad("Prospect not found.", 404);
});

export const DELETE = route(async (_req, { params }) => {
  const g = await guard("prospect_delete"); if (g.res) return g.res;
  const _id = oid(params.id); if (!_id) return bad("Invalid id");
  const d = await getDb();
  await d.collection("prospects").deleteOne({ _id });
  await d.collection("events").updateMany({ pid: params.id }, { $set: { pid: "" } });
  return Response.json({ ok: true });
});
