"use client";
import { useRef, useState } from "react";
import Modal from "./Modal";
import { buildActs, iso, nextAction, today } from "@/lib/cadence";
import { api, getTheme, setTheme, shrink } from "@/lib/client";

const IMG = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;

export function Avatar({ user, lg }) {
  const ok = IMG.test(user.avatar || "");
  const ini = (user.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <span className={"av" + (lg ? " lg" : "")} style={ok ? { backgroundImage: `url(${user.avatar})` } : undefined}>{ok ? "" : ini}</span>;
}

export default function Profile({ me, rows, events, onUser, onLogout, onClose }) {
  const file = useRef(null);
  const [dark, setDark] = useState(() => getTheme() === "dark");
  const [pw, setPw] = useState({ cur: "", next: "" });
  const [msg, setMsg] = useState("");
  const t = iso(today()), low = (x) => (x || "").toLowerCase();
  const od = rows.filter((r) => { const n = nextAction(r); return n && n[1] < t; }).length;
  const td = buildActs(rows, events).filter((a) => a.at.slice(0, 10) === t).length;
  const own = rows.filter((r) => [low(me.name), me.username].includes(low(r.owner))).length;

  const save = async (body) => { try { onUser(await api("profile", { method: "PATCH", body })); return true; } catch (e) { alert(e.message); return false; } };
  async function onFile(e) {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    try { await save({ avatar: await shrink(f) }); } catch { alert("Could not read that image. Try a different one."); }
  }
  async function changePw() {
    if (pw.next.length < 8) return setMsg("New password must be at least 8 characters.");
    if (await save({ currentPassword: pw.cur, newPassword: pw.next })) { setPw({ cur: "", next: "" }); setMsg("Password changed."); }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <Avatar user={me} lg /><b>{me.name}</b>
        <div className="sub">{me.role} · @{me.username}</div>
        <div className="acts" style={{ justifyContent: "center" }}>
          <button className="s" onClick={() => file.current.click()}>Change photo</button>
          <button className="s" onClick={() => save({ avatar: "" })}>Remove photo</button>
        </div>
        <input ref={file} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
      </div>
      <div className="pc"><b>Your day</b><div className="sub">{td} activit{td === 1 ? "y" : "ies"} today · {od} overdue follow-up{od === 1 ? "" : "s"} · {own} prospect{own === 1 ? "" : "s"} owned by you</div></div>
      <label className="sw"><span>Dark mode</span><input type="checkbox" checked={dark} onChange={(e) => { setDark(e.target.checked); setTheme(e.target.checked ? "dark" : "light"); }} /><i /></label>
      <div className="pc">
        <b>Change password</b>
        <div className="g" style={{ marginTop: 6 }}>
          <label>Current password<input type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} autoComplete="current-password" /></label>
          <label>New password (min 8)<input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></label>
        </div>
        <div className="acts"><button className="s" onClick={changePw}>Update password</button></div>
        {msg && <div className="sub" style={{ marginTop: 6 }}>{msg}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <button style={{ color: "var(--er)" }} onClick={onLogout}>Sign out</button><button onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
