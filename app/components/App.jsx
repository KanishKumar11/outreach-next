"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import Login from "./Login";
import Workspace from "./Workspace";

export default function App() {
  const [s, setS] = useState(undefined); // undefined = loading, null = signed out, {user, perms}
  useEffect(() => { api("me").then(setS).catch(() => setS(null)); }, []);
  const onLogout = useCallback(async () => { try { await api("auth/logout", { method: "POST" }); } catch {} setS(null); }, []);
  const onUser = useCallback((user) => setS((x) => (x ? { ...x, user } : x)), []);

  if (s === undefined) return <div className="wrap"><div className="card2" style={{ maxWidth: 440, margin: "60px auto", textAlign: "center" }}><p className="sub">Loading…</p></div></div>;
  if (!s) return <Login onLogin={setS} />;
  return <Workspace me={s.user} perms0={s.perms} onLogout={onLogout} onUser={onUser} />;
}
