const WORKSPACE_BASE_DOMAIN = "vedaschool.ai";

const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 63;

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "www",
  "mail",
  "ftp",
  "login",
  "signup",
  "register",
  "dashboard",
  "support",
  "help",
  "billing",
  "pricing",
  "account",
  "settings",
  "static",
  "assets",
  "cdn",
  "blog",
  "docs",
  "status",
  "vedaschool",
  "root",
  "system",
  "null",
  "undefined",
  "test",
  "demo",
]);

const SUBSCRIPTION_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
};

module.exports = {
  WORKSPACE_BASE_DOMAIN,
  MIN_SLUG_LENGTH,
  MAX_SLUG_LENGTH,
  RESERVED_SLUGS,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
};
