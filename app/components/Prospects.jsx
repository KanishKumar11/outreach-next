"use client";
import { useMemo, useState } from "react";
import Modal from "./Modal";
import { STATUS, iso, nextAction, today } from "@/lib/cadence";
import { api, safeUrl } from "@/lib/client";

const K = ["name", "company", "title", "owner", "url", "notes", "meeting", "followUpAt", "demoAt", "reminderAt"];

export default function Prospects({ rows, can, act, q, setQ, onAdd, onEdit }) {
  const [fo, setFo] = useState(""), [fs, setFs] = useState(""), [fd, setFd] = useState("");
  const t = iso(today());
  const owners = useMemo(() => [...new Set(rows.map((r) => r.owner).filter(Boolean))].sort(), [rows]);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return rows.map((r) => ({ ...r, na: nextAction(r) }))
      .filter((r) => (!fo || r.owner === fo) && (!fs || r.status === fs) &&
        (!s || [r.name, r.company, r.title, r.notes, r.owner].join(" ").toLowerCase().includes(s)) &&
        (!fd || (r.na && r.na[1] <= t)))
      .sort((a, b) => (a.na ? a.na[1] : "9999").localeCompare(b.na ? b.na[1] : "9999"));
  }, [rows, q, fo, fs, fd, t]);

  // Dashboard
  const n = (s) => rows.filter((r) => s.includes(r.status)).length;
  const sent = rows.filter((r) => r.status !== "identified").length;
  const acc = rows.filter((r) => !["identified", "connect_sent"].includes(r.status)).length;
  const rep = rows.filter((r) => ["replied", "meeting_proposed", "meeting_scheduled", "attended", "no_show", "won"].includes(r.status)).length;
  const mtg = rows.filter((r) => ["meeting_scheduled", "attended", "no_show", "won"].includes(r.status)).length;
  const held = n(["attended", "won"]), noshow = n(["no_show"]);
  const od = rows.filter((r) => { const a = nextAction(r); return a && a[1] <= t; }).length;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) + "%" : "–");
  const stats = [["Prospects", rows.length], ["Connects sent", sent], ["Acceptance", pct(acc, sent)], ["Reply rate", pct(rep, acc)], ["Meetings booked", mtg], ["Show-up rate", pct(held, held + noshow)], ["Due / overdue", od]];

  const setStatus = (r, status) => act(() => api("prospects/" + r.id, { method: "PATCH", body: { status, lastActionDate: iso(today()), followUps: status === "msg_sent" && r.status === "msg_sent" ? r.followUps || 0 : 0 } }));
  const logFu = (r) => act(() => api("prospects/" + r.id, { method: "PATCH", body: { followUps: (r.followUps || 0) + 1, lastActionDate: iso(today()) } }));

  function exportCsv() {
    const cols = ["name", "company", "title", "owner", "url", "status", "lastActionDate", "followUps", "meeting", "notes"];
    const csv = [cols.join(",")].concat(rows.map((r) => cols.map((c) => '"' + String(c === "status" ? STATUS[r.status] : r[c] ?? "").replace(/"/g, '""') + '"').join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "outreach-prospects.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="top"><span />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {can("export") && <button onClick={exportCsv}>Export CSV</button>}
          {can("prospect_add") && <button className="p" onClick={onAdd}>+ Add prospect</button>}
        </div>
      </div>
      <div className="stats">{stats.map(([l, v]) => <div className="st" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
      <div className="bar">
        <input placeholder="Search name, company, notes" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={fo} onChange={(e) => setFo(e.target.value)}><option value="">All owners</option>{owners.map((o) => <option key={o}>{o}</option>)}</select>
        <select value={fs} onChange={(e) => setFs(e.target.value)}><option value="">All statuses</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={fd} onChange={(e) => setFd(e.target.value)}><option value="">All dates</option><option value="due">Due today / overdue</option></select>
      </div>
      <div className="tw">
        <table>
          <thead><tr><th>Prospect</th><th>Owner</th><th>Status</th><th>Next action</th><th>Due</th><th>Meeting</th><th></th></tr></thead>
          <tbody>
            {list.map((r) => {
              const due = r.na ? r.na[1] : "", cls = !due ? "" : due < t ? "over" : due === t ? "today" : "fut";
              return (
                <tr key={r.id}>
                  <td><b>{r.name}</b>{safeUrl(r.url) && <> <a href={r.url} target="_blank" rel="noopener noreferrer">in</a></>}
                    <div className="sub">{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>
                    {r.notes && <div className="sub">{r.notes}</div>}</td>
                  <td>{r.owner}</td>
                  <td><select disabled={!can("prospect_edit")} value={r.status} onChange={(e) => setStatus(r, e.target.value)}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td>{r.na ? r.na[0] : <span className="sub">—</span>}</td>
                  <td className={cls}>{due}{cls === "over" ? " (overdue)" : ""}</td>
                  <td className="sub">{r.meeting ? r.meeting.replace("T", " ") : ""}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {(r.status === "msg_sent" || r.status === "connect_sent") && can("prospect_edit") && <><button className="s" onClick={() => logFu(r)}>Log follow-up</button>{" "}</>}
                    {can("prospect_edit") && <button className="s" onClick={() => onEdit(r)}>Edit</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <div className="msg">{rows.length ? "No prospects match the filters." : "No prospects yet. Click “Add prospect”."}</div>}
      </div>
    </div>
  );
}

export function ProspectDialog({ p, can, act, onClose }) {
  const [f, setF] = useState(() => { const o = {}; K.forEach((k) => (o[k] = (p && p[k]) || "")); o.status = p ? p.status : "identified"; return o; });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const field = (k, label, type = "text") => <label>{label}<input type={type} value={f[k]} onChange={set(k)} /></label>;

  async function save() {
    if (!f.name.trim()) return alert("Name is required.");
    const d = { ...f };
    if (p) {
      const changed = d.status !== p.status;
      d.lastActionDate = changed ? iso(today()) : p.lastActionDate || iso(today());
      d.followUps = changed && !(d.status === "msg_sent" && p.status === "msg_sent") ? 0 : p.followUps || 0;
    } else { d.followUps = 0; d.lastActionDate = iso(today()); }
    if (await act(() => api(p ? "prospects/" + p.id : "prospects", { method: p ? "PATCH" : "POST", body: d }))) onClose();
  }
  async function del() {
    if (confirm("Delete this prospect?") && (await act(() => api("prospects/" + p.id, { method: "DELETE" })))) onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="g">
        {field("name", "Name")}{field("company", "Company")}{field("title", "Title")}{field("owner", "Owner (team member)")}
        <label className="f">LinkedIn URL<input value={f.url} placeholder="https://linkedin.com/in/…" onChange={set("url")} /></label>
        <label>Status<select value={f.status} onChange={set("status")}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        {field("meeting", "Meeting date & time", "datetime-local")}
        {field("followUpAt", "Follow-up date & time", "datetime-local")}
        {field("demoAt", "Demo date & time", "datetime-local")}
        {field("reminderAt", "Reminder", "datetime-local")}
        <label className="f">Notes<textarea rows={3} value={f.notes} onChange={set("notes")} /></label>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 14 }}>
        {p && can("prospect_delete") ? <button style={{ color: "var(--er)" }} onClick={del}>Delete</button> : <span />}
        <div style={{ display: "flex", gap: 8 }}><button onClick={onClose}>Cancel</button><button className="p" onClick={save}>Save</button></div>
      </div>
    </Modal>
  );
}
