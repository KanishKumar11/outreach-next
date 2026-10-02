"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { can as canP } from "@/lib/perms";
import Calendar from "./Calendar";
import Prospects, { ProspectDialog } from "./Prospects";
import Team from "./Team";
import Profile, { Avatar } from "./Profile";

export default function Workspace({ me, perms0, onLogout, onUser }) {
  const [perms, setPerms] = useState(perms0 || {});
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("cal");
  const [q, setQ] = useState("");
  const [pdlg, setPdlg] = useState(undefined); // undefined = closed, null = new, object = edit
  const [pf, setPf] = useState(false);
  const [err, setErr] = useState("");
  const sa = me.role === "Super Admin";
  const can = (k) => canP(me.role, perms, k);
  const lo = useRef(onLogout); lo.current = onLogout;

  const load = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([api("prospects"), api("events"), api("perms")]);
      setRows(a); setEvents(b); setPerms(c); setErr("");
      if (sa) setUsers(await api("users"));
    } catch (e) { if (e.status === 401) lo.current(); else setErr(e.message); }
  }, [sa]);

  // Shared data refreshes every 15s so teammates' changes appear without reloading.
  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Run a write, then refresh. Returns true on success.
  const act = async (fn) => { try { await fn(); await load(); return true; } catch (e) { alert(e.message); return false; } };
  const tabBtn = (id, label) => <button className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>;

  return (
    <div className="wrap">
      <div className="top">
        <h1>LinkedIn Outreach Tracker</h1>
        <div className="tabs">
          {tabBtn("cal", "Calendar")}{tabBtn("pros", "Prospects")}{sa && tabBtn("team", "Team")}
          <button className="pf" onClick={() => setPf(true)}><Avatar user={me} /><span>{me.name} · {me.role}</span></button>
        </div>
      </div>
      {err && <div className="msg" style={{ color: "var(--er)" }}>{err}</div>}

      {tab === "cal" && <Calendar rows={rows} events={events} can={can} act={act}
        onAddProspect={() => setPdlg(null)} onEditProspect={(p) => setPdlg(p)}
        onViewProspect={(name) => { setQ(name); setTab("pros"); }} />}
      {tab === "pros" && <Prospects rows={rows} can={can} act={act} q={q} setQ={setQ} onAdd={() => setPdlg(null)} onEdit={(p) => setPdlg(p)} />}
      {tab === "team" && sa && <Team users={users} me={me} perms={perms} act={act} />}

      {pdlg !== undefined && <ProspectDialog p={pdlg} can={can} act={act} onClose={() => setPdlg(undefined)} />}
      {pf && <Profile me={me} rows={rows} events={events} onUser={onUser} onLogout={onLogout} onClose={() => setPf(false)} />}
    </div>
  );
}
