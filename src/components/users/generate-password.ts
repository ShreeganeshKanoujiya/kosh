// Readable temporary password that always satisfies the password policy.
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%*?";

function pick(chars: string, n: number) {
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  return Array.from(buf, (v) => chars[v % chars.length]).join("");
}

export function generatePassword() {
  const parts = [pick(UPPER, 2), pick(LOWER, 6), pick(DIGITS, 3), pick(SYMBOLS, 1)].join("").split("");
  // Fisher–Yates shuffle with crypto randomness.
  const r = new Uint32Array(parts.length);
  crypto.getRandomValues(r);
  for (let i = parts.length - 1; i > 0; i--) {
    const j = r[i] % (i + 1);
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts.join("");
}
