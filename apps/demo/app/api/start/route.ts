import { NextResponse, type NextRequest } from "next/server";
import { ConfidentialPay } from "@a0x/confidential-pay-core";
import { kpCookieHeader } from "@/lib/kp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const pay = new ConfidentialPay();
    const id = crypto.randomUUID().slice(0, 8);
    const wallet = await pay.createWallet(`a0x-demo-${id}`);
    if (!wallet?.address) {
      throw new Error("wallet creation failed");
    }

    const res = NextResponse.redirect(new URL("/start", req.nextUrl.origin), 303);
    res.headers.set("Set-Cookie", kpCookieHeader(wallet.address as `0x${string}`));
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `failed to mint wallet: ${message}` }, { status: 502 });
  }
}