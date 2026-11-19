/**
 * Centralised, per-tab authentication storage.
 *
 * Design rules (Phase 2):
 *  - Authentication is stored in sessionStorage so that each browser tab owns
 *    an independent identity.
 *  - localStorage is NEVER used as an authentication source of truth. The only
 *    localStorage access here is the one-time cleanup of legacy keys.
 *  - Browsers copy sessionStorage when a tab is duplicated (or opened through
 *    window.open with an opener). A per-tab ownership handshake makes sure a
 *    copied tab cannot keep a usable session: the original tab wins and the
 *    copy is forced back to the login page.
 *  - Reloading or navigating inside the original tab keeps the session because
 *    sessionStorage survives reloads and the ownership check recognises the
 *    tab as the incumbent.
 */

export const AUTH_STORAGE_PREFIX = "veda_auth_";
export const AUTH_FLASH_KEY = "auth_flash_message";
export const AUTH_CHANGED_EVENT = "veda:auth-changed";

export const AUTH_KEYS = Object.freeze({
  token: `${AUTH_STORAGE_PREFIX}token`,
  refreshToken: `${AUTH_STORAGE_PREFIX}refreshToken`,
  role: `${AUTH_STORAGE_PREFIX}role`,
  user: `${AUTH_STORAGE_PREFIX}user`,
  permissions: `${AUTH_STORAGE_PREFIX}permissions`,
  platformPermissions: `${AUTH_STORAGE_PREFIX}platformPermissions`,
  userId: `${AUTH_STORAGE_PREFIX}userId`,
  sessionId: `${AUTH_STORAGE_PREFIX}sessionId`,
  ownerId: `${AUTH_STORAGE_PREFIX}ownerId`,
});

// Legacy keys written by the frontend. They are removed once on
// startup and are never read. Removing them means existing users sign in again
// after deployment; no globally shared token can silently authenticate a tab.
export const LEGACY_AUTH_KEYS = Object.freeze([
  "token",
  "refreshToken",
  "role",
  "permissions",
  "platformPermissions",
  "user",
  "userId",
  "sessionId",
  "veda_role",
]);

export const SESSION_REPLACED_MESSAGE =
  "Your account has been logged in from another device. Please sign in again.";
export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";
export const DUPLICATE_TAB_MESSAGE =
  "This tab was duplicated. Please sign in again.";
export const UNVERIFIABLE_SESSION_MESSAGE =
  "This browser cannot verify this tab's session. Please sign in again.";

const TAB_CHANNEL_NAME = "veda-auth-tab-ownership";
const TAB_OWNERSHIP_GRACE_MS = 350;
const TAB_OWNERSHIP_SETTLE_MS = 75;
// Maximum time to wait for a lock held by another context. A reload releases
// the old document's lock almost immediately; a genuine duplicate keeps it for
// the lifetime of the other tab.
const TAB_LOCK_ACQUIRE_MS = 500;
const TAB_LOCK_PREFIX = "veda-auth-tab-lock:";

// Runtime-only identity for this JavaScript context. It is deliberately NOT
// persisted: a duplicated tab receives the same sessionStorage copy but a new
// runtime id, which is what lets the original tab detect the copy.
const RUNTIME_TAB_ID = createRandomId();

let memoryStore = new Map();
let tabChannel = null;
let tabEstablished = false;
let ownershipResult = null;
// One shared in-flight check per owner id. This prevents the login-time claim
// and an early API call from issuing two competing lock requests (which would
// make the second request see `ifAvailable: false` and wrongly log the tab out).
let ownershipPromise = null;
let ownershipOwnerId = null;
const heldLockReleases = new Map();

function createRandomId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
  } catch (_) {
    // fall through to the Math.random fallback
  }
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function storageAvailable() {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    const probe = "__veda_auth_probe__";
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return true;
  } catch (_) {
    return false;
  }
}

const canUseSessionStorage = storageAvailable();

function readRaw(key) {
  if (canUseSessionStorage) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (_) {
      // fall through to the in-memory fallback
    }
  }
  return memoryStore.has(key) ? memoryStore.get(key) : null;
}

function writeRaw(key, value) {
  if (canUseSessionStorage) {
    try {
      window.sessionStorage.setItem(key, value);
      return;
    } catch (_) {
      // fall through to the in-memory fallback
    }
  }
  memoryStore.set(key, value);
}

function removeRaw(key) {
  if (canUseSessionStorage) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (_) {
      // ignore and clear the in-memory copy as well
    }
  }
  memoryStore.delete(key);
}

function safeParse(value, fallback) {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function notifyAuthChange() {
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    }
  } catch (_) {
    // Ignore environments without a DOM event loop.
  }
}



export function migrateLegacyAuthStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    LEGACY_AUTH_KEYS.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (_) {
        // Ignore storage access errors (privacy mode).
      }
    });
  } catch (_) {
    // Ignore storage access errors (privacy mode).
  }
}

/* -------------------------------------------------------------------------- */
/* Auth value accessors                                                       */
/* -------------------------------------------------------------------------- */

export function getAuthToken() {
  return readRaw(AUTH_KEYS.token);
}

export function getRefreshToken() {
  return readRaw(AUTH_KEYS.refreshToken);
}

export function getAuthRole() {
  return readRaw(AUTH_KEYS.role);
}

export function getStoredUserJSON() {
  return readRaw(AUTH_KEYS.user);
}

export function getStoredUser() {
  return safeParse(readRaw(AUTH_KEYS.user), null);
}

export function getStoredPermissions() {
  return safeParse(readRaw(AUTH_KEYS.permissions), []);
}

export function getStoredPlatformPermissions() {
  return safeParse(readRaw(AUTH_KEYS.platformPermissions), null);
}

export function getAuthUserId() {
  const explicit = readRaw(AUTH_KEYS.userId);
  if (explicit) return explicit;
  const user = getStoredUser();
  return user?._id || user?.id || null;
}

export function getAuthSessionId() {
  return readRaw(AUTH_KEYS.sessionId);
}

export function getAuthSnapshot() {
  return {
    token: getAuthToken(),
    refreshToken: getRefreshToken(),
    role: getAuthRole(),
    user: getStoredUser(),
    permissions: getStoredPermissions(),
    platformPermissions: getStoredPlatformPermissions(),
    userId: getAuthUserId(),
    sessionId: getAuthSessionId(),
  };
}

export function hasAuthSession() {
  return Boolean(getAuthToken() || getRefreshToken());
}

export function isTokenExpired(token) {
  if (!token || typeof token !== "string") return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + 5000;
  } catch (_) {
    return true;
  }
}

export function decodeTokenPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (_) {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Auth writers                                                               */
/* -------------------------------------------------------------------------- */

function resolveUserId(user, explicitUserId) {
  if (explicitUserId) return String(explicitUserId);
  if (!user) return null;
  const id = user._id || user.id || user.userId;
  return id ? String(id) : null;
}

/**
 * Stores a complete authentication payload for the current tab.
 * Any previous identity in this tab is replaced atomically.
 */
export function setAuthSession(authData = {}) {
  const { token, refreshToken, role, user, permissions, platformPermissions } = authData;
  const sessionId = authData.sessionId || null;
  const userId = resolveUserId(user, authData.userId);

  if (token) writeRaw(AUTH_KEYS.token, token);
  else removeRaw(AUTH_KEYS.token);

  if (refreshToken) writeRaw(AUTH_KEYS.refreshToken, refreshToken);
  else removeRaw(AUTH_KEYS.refreshToken);

  if (role) writeRaw(AUTH_KEYS.role, role);
  else removeRaw(AUTH_KEYS.role);

  if (user) writeRaw(AUTH_KEYS.user, JSON.stringify(user));
  else removeRaw(AUTH_KEYS.user);

  if (Array.isArray(permissions)) {
    writeRaw(AUTH_KEYS.permissions, JSON.stringify(permissions));
  } else {
    removeRaw(AUTH_KEYS.permissions);
  }

  if (platformPermissions) {
    writeRaw(AUTH_KEYS.platformPermissions, JSON.stringify(platformPermissions));
  } else {
    removeRaw(AUTH_KEYS.platformPermissions);
  }

  if (userId) writeRaw(AUTH_KEYS.userId, userId);
  else removeRaw(AUTH_KEYS.userId);

  if (sessionId) writeRaw(AUTH_KEYS.sessionId, sessionId);
  else removeRaw(AUTH_KEYS.sessionId);

  // A new login starts a new tab lineage so ownership handshakes never reuse
  // the identity of a previous account in this tab.
  rotateAuthOwnerId();
  claimTabOwnership();
  notifyAuthChange();

  return getAuthSnapshot();
}

/** Updates only the rotated token material, never role/permissions/user. */
export function updateAuthTokens({ token, refreshToken, sessionId, userId }) {
  if (token) writeRaw(AUTH_KEYS.token, token);
  if (refreshToken) writeRaw(AUTH_KEYS.refreshToken, refreshToken);
  if (sessionId) writeRaw(AUTH_KEYS.sessionId, sessionId);
  if (userId) writeRaw(AUTH_KEYS.userId, String(userId));
  notifyAuthChange();
}

export function setStoredUser(user) {
  if (!user) {
    removeRaw(AUTH_KEYS.user);
    removeRaw(AUTH_KEYS.userId);
    notifyAuthChange();
    return;
  }
  writeRaw(AUTH_KEYS.user, JSON.stringify(user));
  const userId = resolveUserId(user);
  if (userId) writeRaw(AUTH_KEYS.userId, userId);
  notifyAuthChange();
}

export function clearAuthStorage() {
  Object.values(AUTH_KEYS).forEach((key) => {
    if (key === AUTH_KEYS.ownerId) return;
    removeRaw(key);
  });
  notifyAuthChange();
}

/* -------------------------------------------------------------------------- */
/* Per-tab flash messages                                                     */
/* -------------------------------------------------------------------------- */

export function setAuthFlashMessage(message) {
  if (!message) return;
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(AUTH_FLASH_KEY, message);
      return;
    }
  } catch (_) {
    // fall through
  }
  memoryStore.set(AUTH_FLASH_KEY, message);
}

export function consumeAuthFlashMessage() {
  let message = null;
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      message = window.sessionStorage.getItem(AUTH_FLASH_KEY);
      if (message) window.sessionStorage.removeItem(AUTH_FLASH_KEY);
      return message;
    }
  } catch (_) {
    // fall through
  }
  message = memoryStore.get(AUTH_FLASH_KEY) || null;
  memoryStore.delete(AUTH_FLASH_KEY);
  return message;
}

/* -------------------------------------------------------------------------- */
/* Tab ownership                                                              */
/* -------------------------------------------------------------------------- */

export function getAuthOwnerId() {
  return readRaw(AUTH_KEYS.ownerId);
}

export function rotateAuthOwnerId() {
  const ownerId = createRandomId();
  writeRaw(AUTH_KEYS.ownerId, ownerId);
  return ownerId;
}

export function ensureAuthOwnerId() {
  return getAuthOwnerId() || rotateAuthOwnerId();
}

function getTabChannel() {
  if (tabChannel) return tabChannel;
  if (typeof window === "undefined" || typeof window.BroadcastChannel !== "function") {
    return null;
  }
  try {
    tabChannel = new window.BroadcastChannel(TAB_CHANNEL_NAME);
  } catch (_) {
    tabChannel = null;
  }
  return tabChannel;
}

function rememberResponseForOthers(data) {
  const channel = getTabChannel();
  if (!channel || !data) return;
  if (data.ownerId !== getAuthOwnerId()) return;
  if (data.runtimeId === RUNTIME_TAB_ID) return;

  // An established owner always answers a probe, which denies the challenger.
  if (data.type === "probe") {
    if (!tabEstablished) return;
    channel.postMessage({
      type: "owned",
      ownerId: data.ownerId,
      targetRuntimeId: data.runtimeId,
    });
    return;
  }

  if (data.type !== "claim") return;

  if (tabEstablished) {
    // An established tab is the incumbent. A late challenger (one whose probe
    // landed while this tab was still settling) must be denied explicitly,
    // otherwise it would accept the copied session.
    channel.postMessage({
      type: "owned",
      ownerId: data.ownerId,
      targetRuntimeId: data.runtimeId,
    });
    return;
  }

  // Two copies restored at exactly the same time: the lexicographically
  // smallest runtime id wins. The loser clears only its own storage and is
  // treated as an unauthenticated tab from that point on.
  if (data.runtimeId < RUNTIME_TAB_ID) {
    markOwnershipLost(DUPLICATE_TAB_MESSAGE);
  }
}

function installChannelListener() {
  const channel = getTabChannel();
  if (!channel) return;
  channel.onmessage = (event) => rememberResponseForOthers(event.data);
}

function probeForAnotherOwner(ownerId) {
  const channel = getTabChannel();
  if (!channel) {
    // No coordination primitive available. sessionStorage is still per-tab;
    // document the limitation rather than storing tokens in localStorage.
    return Promise.resolve(false);
  }

  installChannelListener();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.removeEventListener("message", onMessage);
      resolve(result);
    };

    const onMessage = (event) => {
      const data = event.data;
      if (
        data?.type === "owned" &&
        data.ownerId === ownerId &&
        data.targetRuntimeId === RUNTIME_TAB_ID
      ) {
        finish(true);
      }
    };

    const timer = setTimeout(() => finish(false), TAB_OWNERSHIP_GRACE_MS);
    channel.addEventListener("message", onMessage);
    channel.postMessage({
      type: "probe",
      ownerId,
      runtimeId: RUNTIME_TAB_ID,
    });
  });
}

function announceAndAwaitOwnership(ownerId) {
  const channel = getTabChannel();
  if (!channel) return Promise.resolve(false);

  installChannelListener();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.removeEventListener("message", onMessage);
      resolve(result);
    };

    const onMessage = (event) => {
      const data = event.data;
      if (
        data?.type === "owned" &&
        data.ownerId === ownerId &&
        data.targetRuntimeId === RUNTIME_TAB_ID
      ) {
        markOwnershipLost(DUPLICATE_TAB_MESSAGE);
        finish(false);
      }
    };

    const timer = setTimeout(() => {
      // A competing claimant with a smaller runtime id may have marked this tab
      // as lost through the shared message handler.
      finish(ownershipResult !== false);
    }, TAB_OWNERSHIP_SETTLE_MS);

    channel.addEventListener("message", onMessage);
    channel.postMessage({
      type: "claim",
      ownerId,
      runtimeId: RUNTIME_TAB_ID,
    });
  });
}

/**
 * Clears this tab only and marks ownership as denied. Other tabs are never
 * touched: authentication lives in per-tab sessionStorage.
 */
function markOwnershipLost(message) {
  clearAuthStorage();
  rotateAuthOwnerId();
  setAuthFlashMessage(message);
  tabEstablished = false;
  ownershipResult = false;
  ownershipPromise = null;
  ownershipOwnerId = null;
}

async function tryAcquireTabLock(ownerId) {
  if (
    typeof navigator === "undefined" ||
    !navigator.locks ||
    typeof navigator.locks.request !== "function"
  ) {
    return null;
  }

  const lockName = `${TAB_LOCK_PREFIX}${ownerId}`;
  if (heldLockReleases.has(lockName)) return true;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const holdLock = (lock) => {
      if (!lock) {
        finish(false);
        return undefined;
      }
      heldLockReleases.set(lockName, true);
      finish(true);
      // Hold the lock for the lifetime of the tab. It is released by the
      // browser when the tab closes or navigates away.
      return new Promise(() => {});
    };

    const controller =
      typeof AbortController === "function" ? new AbortController() : null;

    const timer = setTimeout(() => {
      // If another live tab owns the lock it never releases it; stop waiting
      // and treat this tab as the duplicate. When AbortController is missing we
      // use `ifAvailable` below instead, so this is only a safety net.
      if (controller) controller.abort();
      finish(false);
    }, TAB_LOCK_ACQUIRE_MS);

    try {
      const options = controller
        ? { signal: controller.signal }
        : { ifAvailable: true };
      navigator.locks
        .request(lockName, options, holdLock)
        .catch((error) => {
          if (error?.name === "AbortError") finish(false);
          else finish(null);
        });
    } catch (_) {
      finish(null);
    }
  });
}

/**
 * Performs the actual ownership verification for a given owner id.
 *
 * `freshLogin` is only true for credentials created by an explicit login in
 * this precise JavaScript context. That matters for browsers that expose
 * neither Web Locks nor BroadcastChannel: a restored/duplicated session cannot
 * be verified and must fail closed, while a just-authenticated tab may continue
 * for the lifetime of the page.
 */
async function performOwnershipCheck(ownerId, { freshLogin = false } = {}) {
  const lockResult = await tryAcquireTabLock(ownerId);
  if (lockResult === true) {
    tabEstablished = true;
    ownershipResult = true;
    return true;
  }
  if (lockResult === false) {
    markOwnershipLost(DUPLICATE_TAB_MESSAGE);
    return false;
  }

  // Web Locks unavailable. BroadcastChannel is the fallback coordination
  // primitive. A restored session that cannot be verified is never trusted.
  const channel = getTabChannel();
  if (!channel) {
    if (freshLogin) {
      // The user just authenticated in this exact context, so the credentials
      // are not a copied session. Reloading or duplicating into a new context
      // will fail closed below.
      tabEstablished = true;
      ownershipResult = true;
      return true;
    }
    markOwnershipLost(UNVERIFIABLE_SESSION_MESSAGE);
    return false;
  }

  const ownedByAnotherTab = await probeForAnotherOwner(ownerId);
  if (ownedByAnotherTab) {
    markOwnershipLost(DUPLICATE_TAB_MESSAGE);
    return false;
  }

  // Give a simultaneously restored copy a chance to answer the claim before we
  // accept the session, so the duplicate never gets a usable window.
  const wonClaim = await announceAndAwaitOwnership(ownerId);
  if (!wonClaim) return false;

  tabEstablished = true;
  ownershipResult = true;
  return true;
}

/**
 * Determines whether this tab may keep the authentication copy it loaded.
 *
 * Resolves true when this tab owns the session (or has no session at all), and
 * false when the sessionStorage copy belongs to another live tab, or when no
 * coordination primitive exists to verify it. Only this tab's storage is
 * cleared on a failed check.
 */
export function ensureTabOwnership() {
  if (ownershipResult !== null) return Promise.resolve(ownershipResult);

  if (!hasAuthSession()) {
    tabEstablished = true;
    ownershipResult = true;
    return Promise.resolve(true);
  }

  const ownerId = ensureAuthOwnerId();
  if (ownershipPromise && ownershipOwnerId === ownerId) return ownershipPromise;

  ownershipOwnerId = ownerId;
  ownershipPromise = performOwnershipCheck(ownerId);
  return ownershipPromise;
}

/**
 * Called after a login in the current tab. A fresh login owns the new session
 * immediately; the shared in-flight check ensures an API call racing the login
 * navigation does not issue a competing lock request.
 */
export function claimTabOwnership() {
  const ownerId = ensureAuthOwnerId();
  tabEstablished = false;
  ownershipResult = null;
  ownershipOwnerId = ownerId;
  ownershipPromise = performOwnershipCheck(ownerId, { freshLogin: true });
  return ownershipPromise;
}

/** Test helper: resets module-level tab ownership state. */
export function __resetAuthStorageForTests() {
  memoryStore = new Map();
  tabChannel = null;
  tabEstablished = false;
  ownershipResult = null;
  ownershipPromise = null;
  ownershipOwnerId = null;
  heldLockReleases.clear();
}

/** Test helper: exposes the current runtime id. */
export function __getRuntimeTabId() {
  return RUNTIME_TAB_ID;
}

export const authStorage = {
  keys: AUTH_KEYS,
  getAuthToken,
  getRefreshToken,
  getAuthRole,
  getStoredUser,
  getStoredUserJSON,
  getStoredPermissions,
  getStoredPlatformPermissions,
  getAuthUserId,
  getAuthSessionId,
  getAuthSnapshot,
  hasAuthSession,
  setAuthSession,
  updateAuthTokens,
  setStoredUser,
  clearAuthStorage,
  isTokenExpired,
  decodeTokenPayload,
  ensureTabOwnership,
  claimTabOwnership,
  migrateLegacyAuthStorage,
  setAuthFlashMessage,
  consumeAuthFlashMessage,
  rotateAuthOwnerId,
  getAuthOwnerId,
  ensureAuthOwnerId,
};

export default authStorage;
