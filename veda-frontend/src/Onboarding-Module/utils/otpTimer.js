export function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function computeExpiresAtMs({ otpExpiresAt, expiresIn, serverNow }) {
  if (otpExpiresAt) {
    return new Date(otpExpiresAt).getTime();
  }
  if (typeof expiresIn === "number" && serverNow) {
    const serverMs = new Date(serverNow).getTime();
    return serverMs + expiresIn * 1000;
  }
  if (typeof expiresIn === "number") {
    return Date.now() + expiresIn * 1000;
  }
  return null;
}

export function getRemainingSeconds(expiresAtMs) {
  if (!expiresAtMs) return 0;
  return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
}
