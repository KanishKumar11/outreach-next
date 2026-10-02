"use client";
import { useMemo, useState } from "react";
import Modal from "./Modal";
import { STATUS, TYPES, buildActs, iso, pd, today } from "@/lib/cadence";
import { api, safeUrl, share } from "@/lib/client";

const mon = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar({ rows, events, can, act, onAddProspect, onEditProspect, onViewProspect }) {
  const [view, setView] = useState("month");
  const [cur, setCur] = useState(today());
  const [ev, setEv] = useState(undefined); // undefined = closed, null = new event, object = edit
  const [sel, setSel] = useState(null);    // selected activity key

  const A = useMemo(() => buildActs(rows, events), [rows, events]);
  const by = useMemo(() => {
    const m = {};
    A.forEach((a) => (m[a.at.slice(0, 10)] = m[a.at.slice(0, 10)] || []).push(a));
    for (const k in m) m[k].sort((x, y) => x.at.localeCompare(y.at));
    return m;
  }, [A]);
  const selDay = iso(cur), t = iso(today());
  const f = (o) => cur.toLocaleDateString(undefined, o);
  const title = view === "month" ? f({ month: "long", year: "numeric" })
    : view === "week" ? "Week of " + mon(cur).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : f({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const nav = (n) => setCur(view === "month" ? new Date(cur.getFullYear(), cur.getMonth() + n, 1)
    : new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + n * (view === "week" ? 7 : 1)));

  const chip = (a) => (
    <div key={a.key} className={"ch " + a.type} onClick={(e) => { e.stopPropagation(); setSel(a.key); }}>
      {a.at.length > 10 ? a.at.slice(11, 16) + " " : ""}{a.title}
    </div>
  );

  let cells = [];
  if (view !== "day") {
    const s = view === "month" ? mon(new Date(cur.getFullYear(), cur.getMonth(), 1)) : mon(cur), n = view === "month" ? 42 : 7;
    for (let i = 0; i < n; i++) cells.push(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
  }
  const lim = view === "month" ? 3 : 50;
  const day = by[selDay] || [];
  const act1 = sel ? A.find((x) => x.key === sel) : null;

  return (
    <div>
      <div className="top">
        <div className="tabs"><button onClick={() => nav(-1)}>‹</button><button onClick={() => setCur(today())}>Today</button><button onClick={() => nav(1)}>›</button><b style={{ marginLeft: 6 }}>{title}</b></div>
        <div className="tabs">
          {["month", "week", "day"].map((v) => <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
          {can("event_create") && <button onClick={() => setEv(null)}>+ Event</button>}
          {can("prospect_add") && <button className="p" onClick={onAddProspect}>+ Prospect</button>}
        </div>
      </div>

      {view !== "day" && (
        <div className="tw" style={{ marginBottom: 12 }}>
          <div className="cg">
            {DOW.map((x) => <div className="h" key={x}>{x}</div>)}
            {cells.map((d) => {
              const k = iso(d), l = by[k] || [];
              return (
                <div key={k} className={"cell" + (view === "month" && d.getMonth() !== cur.getMonth() ? " out" : "") + (k === selDay ? " sel" : "") + (k === t ? " tod" : "")} onClick={() => setCur(pd(k))}>
                  <div className="dn">{d.getDate()}</div>
                  {l.slice(0, lim).map(chip)}
                  {l.length > lim && <div className="sub">+{l.length - lim} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card2">
        <b>{f({ weekday: "long", day: "numeric", month: "long" })}{selDay === t ? " (today)" : ""} — {day.length} item{day.length === 1 ? "" : "s"}</b>
        <div>
          {day.length ? day.map((a) => (
            <div className="ag" key={a.key} onClick={() => setSel(a.key)}>
              <span className="tm">{a.at.length > 10 ? a.at.slice(11, 16) : "All day"}</span>
              <span className={"ch " + a.type} style={{ flex: "none" }}>{a.label}</span>
              <span>{a.title}{a.conf ? " ✓" : ""}</span>
            </div>
          )) : <div className="msg">Nothing scheduled. Use “+ Event” or “+ Prospect”.</div>}
        </div>
      </div>

      {act1 && <ActDialog a={act1} p={rows.find((r) => r.id === act1.pid)} e={events.find((x) => x.id === act1.eid)} can={can} act={act}
        onClose={() => setSel(null)} onView={onViewProspect} onUpdate={onEditProspect} onEdit={(e) => setEv(e)} setCur={setCur} />}
      {ev !== undefined && <EvDialog ev={ev} cur={cur} rows={rows} can={can} act={act} onClose={() => setEv(undefined)} setCur={setCur} />}
    </div>
  );
}

function EvDialog({ ev, cur, rows, can, act, onClose, setCur }) {
  const [f, setF] = useState({ title: ev?.title || "", type: ev?.type || "meeting", start: ev?.start || iso(cur) + "T09:00", pid: ev?.pid || "", notes: ev?.notes || "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save() {
    if (!f.title.trim() || !f.start) return alert("Title and date/time are required.");
    if (await act(() => api(ev ? "events/" + ev.id : "events", { method: ev ? "PATCH" : "POST", body: f }))) { setCur(pd(f.start.slice(0, 10))); onClose(); }
  }
  async function del() { if (confirm("Delete this event?") && (await act(() => api("events/" + ev.id, { method: "DELETE" })))) onClose(); }
  return (
    <Modal onClose={onClose}>
      <div className="g">
        <label className="f">Title<input value={f.title} onChange={set("title")} /></label>
        <label>Type<select value={f.type} onChange={set("type")}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Date &amp; time<input type="datetime-local" value={f.start} onChange={set("start")} /></label>
        <label className="f">Related prospect (optional)<select value={f.pid} onChange={set("pid")}><option value="">— none —</option>{rows.map((r) => <option key={r.id} value={r.id}>{r.name}{r.company ? " – " + r.company : ""}</option>)}</select></label>
        <label className="f">Notes<textarea rows={3} value={f.notes} onChange={set("notes")} /></label>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 14 }}>
        {ev && can("event_delete") ? <button style={{ color: "var(--er)" }} onClick={del}>Delete</button> : <span />}
        <div style={{ display: "flex", gap: 8 }}><button onClick={onClose}>Cancel</button><button className="p" onClick={save}>Save</button></div>
      </div>
    </Modal>
  );
}

function ActDialog({ a, p, e, can, act, onClose, onView, onUpdate, onEdit, setCur }) {
  const [rs, setRs] = useState(a.at.length > 10 ? a.at : a.at + "T09:00");
  const first = p ? p.name.split(" ")[0] : "", when = a.at.replace("T", " at ");
  const patchP = (body) => act(() => api("prospects/" + p.id, { method: "PATCH", body }));
  const B = [];
  if (p) {
    B.push(["view", "View prospect"]);
    if (a.type === "meeting" && can("prospect_edit")) B.push(["confirm", p.meetingConfirmed ? "Meeting confirmed ✓" : "Confirm meeting"]);
    B.push(["remind", "Remind prospect"], ["contact", "Contact / follow up"]);
    if (a.type === "demo" || a.type === "meeting") B.push(["demo", "Coordinate with demo team"]);
    if (can("prospect_edit")) B.push(["update", "Update prospect"]);
  }
  if (a.eid) { if (can("event_edit")) B.push(["editev", "Edit event"]); if (can("event_delete")) B.push(["delev", "Delete event"]); }
  const canResched = a.eid ? can("event_edit") : p && can("prospect_edit");

  async function run(x) {
    if (x === "view") { onClose(); onView(p.name); }
    if (x === "confirm") { await patchP({ meetingConfirmed: true }); onClose(); }
    if (x === "remind") share(`Hi ${first}, a quick reminder about our ${a.label.toLowerCase()} on ${when}. Looking forward to speaking with you!`, p.url);
    if (x === "contact") { if (can("prospect_edit")) await patchP({ followUps: (p.followUps || 0) + 1, lastActionDate: iso(today()) }); share(`Hi ${first}, following up on my earlier message. Would you be open to a quick chat this week?`, p.url); }
    if (x === "demo") share(`Demo team brief: ${p.name} (${p.company || "-"}), ${when}. Owner: ${p.owner || "-"}. Notes: ${p.notes || "-"}. LinkedIn: ${p.url || "-"}`);
    if (x === "update") { onClose(); onUpdate(p); }
    if (x === "editev") { onClose(); onEdit(e); }
    if (x === "delev" && confirm("Delete this event?")) { if (await act(() => api("events/" + a.eid, { method: "DELETE" }))) onClose(); }
    if (x === "resched") {
      if (!rs) return;
      const ok = a.eid ? await act(() => api("events/" + a.eid, { method: "PATCH", body: { start: rs } })) : await patchP({ [a.f]: rs });
      if (ok) { setCur(pd(rs.slice(0, 10))); onClose(); }
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ margin: "0 0 4px" }}>{a.title}</h3>
      <div className="sub">{a.label} · {a.at.replace("T", " ")}{a.conf ? " · Confirmed ✓" : ""}</div>
      {a.notes && <p>{a.notes}</p>}
      {p && (
        <div className="pc">
          <b>{p.name}</b> <span className="tag">{STATUS[p.status]}</span>
          <div className="sub">{p.title}{p.title && p.company ? " · " : ""}{p.company} · Owner: {p.owner}</div>
          {safeUrl(p.url) && <a href={p.url} target="_blank" rel="noopener noreferrer">LinkedIn profile</a>}
          {p.notes && <div>{p.notes}</div>}
        </div>
      )}
      <div className="acts">{B.map(([x, l]) => <button key={x} className="s" onClick={() => run(x)}>{l}</button>)}</div>
      {canResched && <div className="acts"><input type="datetime-local" value={rs} onChange={(ev) => setRs(ev.target.value)} /><button className="s" onClick={() => run("resched")}>Reschedule</button></div>}
      <div style={{ textAlign: "right", marginTop: 12 }}><button onClick={onClose}>Close</button></div>
    </Modal>
  );
}
