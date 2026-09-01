import { NextResponse, type NextRequest } from "next/server";
import { forgetKpCookie } from "@/lib/kp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.nextUrl.origin), 303);
  res.headers.set("Set-Cookie", forgetKpCookie());
  return res;
}