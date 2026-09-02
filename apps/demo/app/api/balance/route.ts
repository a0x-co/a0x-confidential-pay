import { NextResponse } from "next/server";
import { ConfidentialPay } from "@bvdaniel/private-pay-core";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }

  try {
    const pay = new ConfidentialPay();
    const [usdc, eth] = await Promise.all([
      pay.getUsdcBalance(wallet as `0x${string}`),
      pay.getNativeBalance(wallet as `0x${string}`),
    ]);
    return NextResponse.json({ usdc, eth });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}