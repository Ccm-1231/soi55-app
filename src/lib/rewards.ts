const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid mix-ups

function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export function generateCouponCode(): string {
  return `SOI55-${randomCode(5)}`;
}

export function generateDrawEntryNumber(): string {
  return `IPAD-${randomCode(4)}`;
}
