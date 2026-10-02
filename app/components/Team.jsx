"use client";
import { useState } from "react";
import { api, genPw } from "@/lib/client";
import { DEF, PERMS, ROLES } from "@/lib/perms";

export default function Team({ users, me, perms, act }) {
  const [f, setF] = useState({ name: "", username: "", password: "", role: "Member" });
  const [msg, setMsg] = useState("");
  const [resetFor, setResetFor] = useState(null); // user being given a new password
  const [reqRole, setReqRole] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const RL = ROLES.slice(1);
  const reqs = users.filter((u) => u.status === "pending" || u.status === "rejected");
  const members = users.filter((u) => u.status === "active" || u.status === "inactive");

  async function submit() {
    const name = f.name.trim(), username = f.username.trim().toLowerCase();
    if (resetFor) {
      if (f.password.length < 8) return setMsg("Password must be at least 8 characters.");
      if (await act(() => api("users/" + resetFor.id, { method: "PATCH", body: { password: f.password } }))) {
        setMsg("Password updated. Share the new password with " + resetFor.name + "."); setResetFor(null); setF({ name: "", username: "", password: "", role: "Member" });
      }
      return;
    }
    if (!name || !/^[a-z0-9._-]{3,30}$/.test(username) || f.password.length < 8) return setMsg("Enter a name, a username (3–30 letters, numbers or . _ -) and a password of at least 8 characters.");
    if (await act(() => api("users", { method: "POST", body: { ...f, name, username } }))) {
      setMsg("User created. Share the username and password with " + name + "."); setF({ name: "", username: "", password: "", role: "Member" });
    }
  }
  const startReset = (u) => { setResetFor(u); setF({ name: u.name, username: u.username, password: genPw(), role: u.role }); setMsg("Enter a new password (or use the generated one) and click Update password."); };
  const patch = (u, body) => act(() => api("users/" + u.id, { method: "PATCH", body }));
  const setPerm = (r, k, on) => act(() => api("perms", { method: "PUT", body: { perms: { ...Object.fromEntries(RL.map((x) => [x, { ...(perms[x] || DEF[x] || {}) }])), [r]: { ...(perms[r] || DEF[r] || {}), [k]: on ? 1 : 0 } } } }));

  return (
    <div>
      <div className="card2" style={{ marginBottom: 12 }}>
        <b>{resetFor ? "Reset password" : "Create user"}</b> <span className="sub">{resetFor ? "for @" + resetFor.username : "Set a username and password and assign a role."}</span>
        <div className="g" style={{ marginTop: 8 }}>
          <label>Full name<input value={f.name} onChange={set("name")} disabled={!!resetFor} /></label>
          <label>Username<input value={f.username} onChange={set("username")} autoComplete="off" disabled={!!resetFor} /></label>
          <label>Password (min 8)<input value={f.password} onChange={set("password")} autoComplete="off" /></label>
          <label>Role<select value={f.role} onChange={set("role")} disabled={!!resetFor}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setF({ ...f, password: genPw() })}>Generate password</button>
          <button className="p" onClick={submit}>{resetFor ? "Update password" : "Create user"}</button>
          {resetFor && <button onClick={() => { setResetFor(null); setMsg(""); setF({ name: "", username: "", password: "", role: "Member" }); }}>Cancel</button>}
        </div>
        <div className="sub" style={{ marginTop: 6 }}>{msg}</div>
      </div>

      <div className="card2" style={{ marginBottom: 12 }}>
        <b>Access requests</b>
        {reqs.length ? reqs.map((r) => (
          <div className="ag" style={{ cursor: "default" }} key={r.id}>
            <span style={{ flex: 1 }}>{r.name} <span className="sub">@{r.username} · {r.status} · {r.createdAt || ""}</span></span>
            <select value={reqRole[r.id] || "Member"} onChange={(e) => setReqRole({ ...reqRole, [r.id]: e.target.value })}>{RL.map((x) => <option key={x}>{x}</option>)}</select>
            <button className="s p" onClick={() => patch(r, { status: "active", role: reqRole[r.id] || "Member" })}>Approve</button>
            {r.status === "pending" && <button className="s" onClick={() => patch(r, { status: "rejected" })}>Reject</button>}
            <button className="s" onClick={() => confirm("Delete this request?") && act(() => api("users/" + r.id, { method: "DELETE" }))}>Delete</button>
          </div>
        )) : <div className="sub" style={{ padding: "8px 0" }}>No pending requests.</div>}
      </div>

      <div className="card2" style={{ marginBottom: 12 }}>
        <b>Members</b>
        {members.map((u) => (
          <div className="ag" style={{ cursor: "default" }} key={u.id}>
            <span style={{ flex: 1 }}>{u.name} <span className="sub">@{u.username}</span> <span className="tag">{u.status}</span></span>
            <select value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u, { role: e.target.value })}>{ROLES.map((x) => <option key={x}>{x}</option>)}</select>
            {u.id !== me.id && <>
              <button className="s" onClick={() => patch(u, { status: u.status === "active" ? "inactive" : "active" })}>{u.status === "active" ? "Deactivate" : "Activate"}</button>
              <button className="s" onClick={() => startReset(u)}>Reset password</button>
              <button className="s" onClick={() => confirm("Remove this user?") && act(() => api("users/" + u.id, { method: "DELETE" }))}>Remove</button>
            </>}
          </div>
        ))}
      </div>

      <div className="card2">
        <b>Permissions</b> <span className="sub">Super Admin always has everything</span>
        <table style={{ minWidth: 0, marginTop: 6 }}>
          <thead><tr><th></th>{RL.map((r) => <th key={r}>{r}</th>)}</tr></thead>
          <tbody>{Object.entries(PERMS).map(([k, l]) => (
            <tr key={k}><td>{l}</td>{RL.map((r) => <td key={r}><input type="checkbox" checked={!!(perms[r] || DEF[r] || {})[k]} onChange={(e) => setPerm(r, k, e.target.checked)} /></td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
