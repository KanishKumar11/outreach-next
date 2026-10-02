// Browser helpers
export async function api(path, { method = "GET", body } = {}) {
  const r = await fetch("/api/" + path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "Request failed"), { status: r.status });
  return j;
}
export const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
export async function share(text, url) {
  try { await navigator.clipboard.writeText(text); alert("Message copied to clipboard."); }
  catch { prompt("Copy this message:", text); }
  if (safeUrl(url)) window.open(url, "_blank", "noopener");
}
export function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("ot_theme", t); } catch {}
}
export const getTheme = () => document.documentElement.getAttribute("data-theme") || "light";
export function genPw() {
  const c = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => c[b % c.length]).join("");
}
// Crop to a 128px square JPEG data URL
export function shrink(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const c = document.createElement("canvas"), m = Math.min(im.width, im.height);
        c.width = c.height = 128;
        c.getContext("2d").drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, 128, 128);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
