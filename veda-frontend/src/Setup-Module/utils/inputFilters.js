/** Strip non-digits; optional max length */
export function digitsOnly(value, maxLength) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (maxLength != null) return digits.slice(0, maxLength);
  return digits;
}

/** Established year: up to 4 digits only */
export function sanitizeEstablishedYear(value) {
  return digitsOnly(value, 4);
}

/** Block scientific notation and signs on number-like fields */
export function blockNonDigitNumberKeys(e) {
  if (["e", "E", "+", "-", "."].includes(e.key)) {
    e.preventDefault();
  }
}
