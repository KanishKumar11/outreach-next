// Shared (client + server): roles and permission defaults.
export const ROLES = ["Super Admin", "Admin", "Manager", "Member"];
export const PERMS = {
  event_create: "Create events", event_edit: "Edit events", event_delete: "Delete events",
  prospect_add: "Add prospects", prospect_edit: "Edit prospects", prospect_delete: "Delete prospects", export: "Export CSV",
};
export const DEF = {
  Admin: { event_create: 1, event_edit: 1, event_delete: 1, prospect_add: 1, prospect_edit: 1, prospect_delete: 1, export: 1 },
  Manager: { event_create: 1, event_edit: 1, event_delete: 1, prospect_add: 1, prospect_edit: 1, export: 1 },
  Member: { event_create: 1, event_edit: 1, prospect_add: 1, prospect_edit: 1 },
};
export const can = (role, perms, p) => role === "Super Admin" || !!((perms && perms[role]) || DEF[role] || {})[p];
