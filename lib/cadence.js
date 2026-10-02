// Shared (client + server): statuses, follow-up cadence and calendar activity builder.
export const STATUS = {
  identified: "Identified", connect_sent: "Connection sent", accepted: "Accepted", msg_sent: "Message sent",
  replied: "Replied", meeting_proposed: "Meeting proposed", meeting_scheduled: "Meeting scheduled",
  attended: "Attended", no_show: "No-show", nurture: "Nurture", won: "Closed – won", lost: "Closed – lost",
};
export const TYPES = { meeting: "Meeting", demo: "Demo", followup: "Follow-up", reminder: "Reminder", outreach: "LinkedIn outreach", other: "Other" };
export const DAY = 864e5;
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const iso = (d) => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
export const pd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

// Cadence rules: [next action, days after last action]. Edit here to change the process.
const FU = [3, 7, 14];
export function nextAction(p) {
  const last = p.lastActionDate ? pd(p.lastActionDate) : today();
  const add = (n) => iso(new Date(last.getTime() + n * DAY));
  const fu = p.followUps || 0;
  switch (p.status) {
    case "identified": return ["Send connection request", add(0)];
    case "connect_sent": return fu < 1 ? ["Engage with their post, check acceptance", add(5)] : ["Withdraw request; retry later or try email", add(9)];
    case "accepted": return ["Send intro message", add(1)];
    case "msg_sent": return fu < FU.length ? ["Follow-up #" + (fu + 1), add(FU[fu])] : ["Move to Nurture", add(0)];
    case "replied": return ["Propose meeting slots", add(0)];
    case "meeting_proposed": return ["Nudge for a slot", add(3)];
    case "meeting_scheduled": return p.meeting ? ["Send reminder (24h before)", iso(new Date(new Date(p.meeting).getTime() - DAY))] : ["Add meeting date", add(0)];
    case "no_show": return ["Send reschedule message", add(0)];
    case "attended": return ["Thank-you + next steps", add(1)];
    case "nurture": return ["Re-engage", add(60)];
    default: return null;
  }
}

// Everything that appears on the calendar: prospect dates, auto next steps and manual events.
export function buildActs(rows, events) {
  const a = [], t = iso(today());
  const F = [["meeting", "meeting", "Meeting"], ["demoAt", "demo", "Demo"], ["followUpAt", "followup", "Follow-up"], ["reminderAt", "reminder", "Reminder"]];
  rows.forEach((p) => {
    F.forEach(([f, type, label]) => {
      if (p[f]) a.push({ key: "p:" + p.id + ":" + f, pid: p.id, f, type, label, at: p[f], title: label + ": " + p.name + (p.company ? " · " + p.company : ""), conf: f === "meeting" && p.meetingConfirmed });
    });
    if (!p.followUpAt) {
      const n = nextAction(p);
      if (n) { const od = n[1] < t; a.push({ key: "p:" + p.id + ":auto", pid: p.id, f: "followUpAt", type: "followup", label: "Next step", at: od ? t : n[1], title: (od ? "(overdue) " : "") + n[0] + " – " + p.name }); }
    }
  });
  events.forEach((e) => { if (e.start) a.push({ key: "e:" + e.id, eid: e.id, pid: e.pid, type: e.type || "other", label: TYPES[e.type] || "Event", at: e.start, title: e.title, notes: e.notes }); });
  return a;
}
