"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const box = { width: "100%", marginBottom: 8 };

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    try {
      if (mode === "login") onLogin(await api("auth/login", { method: "POST", body: { username: f.username, password: f.password } }));
      else {
        await api("auth/request", { method: "POST", body: f });
        setMode("login"); setF({ ...f, password: "" });
        setMsg("Request sent. You can sign in once the Super Admin approves it.");
      }
    } catch (x) { setMsg(x.message); }
    setBusy(false);
  }

  return (
    <div className="wrap">
      <form className="card2" onSubmit={submit} style={{ maxWidth: 440, margin: "60px auto", textAlign: "center" }}>
        <h1>LinkedIn Outreach Tracker</h1>
        <p className="sub" style={{ fontSize: 14 }}>{msg || (mode === "login" ? "Sign in with the username and password from your Super Admin." : "Tell us who you are. The Super Admin will review your request.")}</p>
        {mode === "request" && <input style={box} placeholder="Full name" value={f.name} onChange={set("name")} autoComplete="name" />}
        <input style={box} placeholder="Username" value={f.username} onChange={set("username")} autoComplete="username" />
        <input style={box} type="password" placeholder={mode === "login" ? "Password" : "Choose a password (min 8)"} value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        <button className="p" style={{ width: "100%", marginTop: 4 }} disabled={busy}>{mode === "login" ? "Sign in" : "Send request"}</button>
        <button type="button" className="s" style={{ marginTop: 10 }} onClick={() => { setMode(mode === "login" ? "request" : "login"); setMsg(""); }}>
          {mode === "login" ? "Request access" : "Back to sign in"}
        </button>
      </form>
    </div>
  );
}
