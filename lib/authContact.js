/** Parse either an email address or a Bangladesh mobile number. */
export function parseAuthContact(value) {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return { email: input.toLowerCase() };
  const digits = input.replace(/[০-৯]/g, c => String("০১২৩৪৫৬৭৮৯".indexOf(c))).replace(/[\s()-]/g, "");
  const local = digits.replace(/^(?:\+880|00880|880)/, "0");
  return /^01[3-9]\d{8}$/.test(local) ? { phone: `+88${local}` } : null;
}
