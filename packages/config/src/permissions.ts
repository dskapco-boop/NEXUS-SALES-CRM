// Role-Based Access Control definitions
export type Role = "admin" | "sales_manager" | "sales_rep" | "viewer";

export type Permission =
  | "leads:create"
  | "leads:read"
  | "leads:update"
  | "leads:delete"
  | "leads:assign"
  | "leads:convert"
  | "contacts:create"
  | "contacts:read"
  | "contacts:update"
  | "contacts:delete"
  | "contacts:import"
  | "opportunities:create"
  | "opportunities:read"
  | "opportunities:update"
  | "opportunities:delete"
  | "opportunities:change_stage"
  | "quotes:create"
  | "quotes:read"
  | "quotes:update"
  | "quotes:delete"
  | "quotes:send"
  | "quotes:approve"
  | "orders:create"
  | "orders:read"
  | "orders:update"
  | "orders:delete"
  | "orders:fulfill"
  | "invoices:create"
  | "invoices:read"
  | "invoices:update"
  | "invoices:delete"
  | "invoices:send"
  | "invoices:record_payment"
  | "activities:create"
  | "activities:read"
  | "activities:update"
  | "activities:delete"
  | "users:manage"
  | "roles:manage"
  | "settings:manage"
  | "audit:read"
  | "reports:read"
  | "integrations:manage";

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "leads:create", "leads:read", "leads:update", "leads:delete", "leads:assign", "leads:convert",
    "contacts:create", "contacts:read", "contacts:update", "contacts:delete", "contacts:import",
    "opportunities:create", "opportunities:read", "opportunities:update", "opportunities:delete", "opportunities:change_stage",
    "quotes:create", "quotes:read", "quotes:update", "quotes:delete", "quotes:send", "quotes:approve",
    "orders:create", "orders:read", "orders:update", "orders:delete", "orders:fulfill",
    "invoices:create", "invoices:read", "invoices:update", "invoices:delete", "invoices:send", "invoices:record_payment",
    "activities:create", "activities:read", "activities:update", "activities:delete",
    "users:manage", "roles:manage", "settings:manage", "audit:read", "reports:read", "integrations:manage",
  ],
  sales_manager: [
    "leads:create", "leads:read", "leads:update", "leads:assign", "leads:convert",
    "contacts:create", "contacts:read", "contacts:update", "contacts:import",
    "opportunities:create", "opportunities:read", "opportunities:update", "opportunities:change_stage",
    "quotes:create", "quotes:read", "quotes:update", "quotes:send", "quotes:approve",
    "orders:create", "orders:read", "orders:update", "orders:fulfill",
    "invoices:create", "invoices:read", "invoices:update", "invoices:send", "invoices:record_payment",
    "activities:create", "activities:read", "activities:update", "activities:delete",
    "reports:read",
  ],
  sales_rep: [
    "leads:create", "leads:read", "leads:update", "leads:convert",
    "contacts:create", "contacts:read", "contacts:update",
    "opportunities:create", "opportunities:read", "opportunities:update", "opportunities:change_stage",
    "quotes:create", "quotes:read", "quotes:update", "quotes:send",
    "orders:create", "orders:read", "orders:update",
    "invoices:read", "invoices:record_payment",
    "activities:create", "activities:read", "activities:update",
  ],
  viewer: [
    "leads:read",
    "contacts:read",
    "opportunities:read",
    "quotes:read",
    "orders:read",
    "invoices:read",
    "activities:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canAccessAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => rolePermissions[role].includes(p));
}
