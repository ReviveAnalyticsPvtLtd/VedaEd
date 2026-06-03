/** ISO 3166-1 alpha-2 → flag emoji */
export function isoToFlagEmoji(isoCode) {
  if (!isoCode || isoCode.length !== 2) return "";
  const code = isoCode.toUpperCase();
  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0))
  );
}
