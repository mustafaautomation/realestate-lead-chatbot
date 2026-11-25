export function maskPii(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => {
      const [name, domain] = email.split("@");
      return `${name.slice(0, 1)}***@${domain}`;
    })
    .replace(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g, "***-***-****");
}

export function maskValue(value: unknown): unknown {
  if (typeof value === "string") return maskPii(value);
  if (Array.isArray(value)) return value.map((item) => maskValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, maskValue(item)]));
  }
  return value;
}
