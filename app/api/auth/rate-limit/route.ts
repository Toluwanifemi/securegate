import { NextResponse } from "next/server";
import { loginRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip";

export async function POST(req: Request) {
  // Rate limiting check
  const ip = getClientIp(req);
  const limitRes = await loginRateLimit.limit(`signin:${ip}`);
  
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
  
  return NextResponse.json({ success: true });
}
