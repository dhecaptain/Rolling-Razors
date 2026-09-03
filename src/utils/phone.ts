export function phoneKey(phone: string): string {
  return String(phone || "").replace(/\D/g, "").replace(/^254/, "0").slice(-9);
}
export function phonesMatch(a: string, b: string): boolean {
  const ka = phoneKey(a); const kb = phoneKey(b);
  return Boolean(ka && kb && ka === kb);
}
export function normalizePhoneKe(input: string): string {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length >= 12) {
    const d = digits.slice(3);
    return `+254 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`.trim();
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    const d = digits.slice(1, 10);
    return `+254 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`.trim();
  }
  if (digits.length === 9) return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`.trim();
  return String(input).trim();
}
export function formatPhoneForDisplay(phone: string): string { return normalizePhoneKe(phone); }
