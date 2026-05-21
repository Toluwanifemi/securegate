import { type NextRequest } from "next/server";

export function getClientIp(req: Request | NextRequest): string {
  // If it's a NextRequest and has a populated ip field, use it (populated securely by platform e.g. Vercel)
  if ("ip" in req && req.ip) {
    return req.ip;
  }

  // Support secure platforms like Vercel
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  // For other platforms, check if we explicitly trust proxy headers
  const trustProxy = process.env.TRUST_PROXY === "true";
  if (trustProxy) {
    const xRealIp = req.headers.get("x-real-ip");
    if (xRealIp) return xRealIp;

    const xForwardedFor = req.headers.get("x-forwarded-for");
    if (xForwardedFor) {
      return xForwardedFor.split(",")[0].trim();
    }
  }

  // Fallback to localhost if no trusted headers are present or proxy trust is disabled
  return "127.0.0.1";
}
