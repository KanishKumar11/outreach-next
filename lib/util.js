export const bad = (m, s = 400) => Response.json({ error: m }, { status: s });
// Mongo document -> JSON (renames _id, never exposes the password hash)
export const ser = (d) => { if (!d) return d; const { _id, passHash, ...r } = d; return { id: String(_id), ...r }; };
export const str = (v, n = 2000) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const url = (u) => (/^https?:\/\/\S+$/i.test(u) ? u : "");
const dt = (v) => (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v || "") ? v : "");
const DATES = ["meeting", "followUpAt", "demoAt", "reminderAt", "lastActionDate", "start"];

// Whitelist + sanitise request body fields
export function clean(body, fields) {
  const o = {};
  for (const f of fields) {
    if (!(f in body)) continue;
    const v = body[f];
    if (f === "url") o[f] = url(str(v, 500));
    else if (DATES.includes(f)) o[f] = dt(str(v, 16));
    else if (f === "followUps") o[f] = Math.max(0, Math.min(99, parseInt(v) || 0));
    else if (f === "meetingConfirmed") o[f] = !!v;
    else o[f] = str(v, f === "notes" ? 4000 : 300);
  }
  return o;
}

export const route = (h) => async (req, ctx) => {
  try { return await h(req, ctx); }
  catch (e) { console.error(e); return bad("Server error. Check the server logs and your MongoDB settings.", 500); }
};

// Tiny in-memory rate limiter (per server instance)
const hits = new Map();
export const rl = {
  check(k, max = 8, win = 9e5) { const n = Date.now(); const a = (hits.get(k) || []).filter((t) => n - t < win); hits.set(k, a); return a.length >= max; },
  fail(k) { const a = hits.get(k) || []; a.push(Date.now()); hits.set(k, a); },
  clear(k) { hits.delete(k); },
};
export const USERNAME = /^[a-z0-9._-]{3,30}$/;
