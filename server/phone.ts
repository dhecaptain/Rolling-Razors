export function normalizePhoneKe(input: string): string {
  const digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("254")) return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`.trim();
  if (digits.startsWith("0") && digits.length >= 10) {
    const d = digits.slice(1);
    return `+254 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`.trim();
  }
  if (digits.length === 9) return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`.trim();
  return `+254 ${digits}`.trim();
}

export function toDarajaPhone(input: string): string {
  const digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

export function phoneKey(input: string): string {
  return String(input).replace(/\D/g, "").replace(/^254/, "0").slice(-9);
}

export function phonesMatch(a: string, b: string): boolean {
  return phoneKey(a) === phoneKey(b);
}

export function isValidKePhone(input: string): boolean {
  const d = String(input).replace(/\D/g, "");
  const key = d.startsWith("254") ? d.slice(3) : d.startsWith("0") ? d.slice(1) : d;
  return key.length === 9 && key.startsWith("7");
}
