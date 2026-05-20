export function getClientIp(req: Request): string {
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  return "127.0.0.1";
}
