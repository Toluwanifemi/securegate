export function validateCsrf(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  
  // Align strictly with security.md rules: use Host header, or X-Forwarded-Host only if explicitly trusted
  const trustProxy = process.env.TRUST_PROXY === "true";
  const host = req.headers.get("host") || (trustProxy ? req.headers.get("x-forwarded-host") : null);

  if (!host) return false;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  return false;
}
