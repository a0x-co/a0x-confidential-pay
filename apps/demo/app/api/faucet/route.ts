import { NextResponse } from "next/server";
import { ConfidentialPay } from "@bvdaniel/private-pay-core";

export const runtime = "nodejs";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: Request) {
  let body: { wallet?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const wallet = body.wallet;
  if (typeof wallet !== "string" || !ADDRESS_RE.test(wallet)) {
    return NextResponse.json({ error: "wallet must be a 0x address" }, { status: 400 });
  }

  try {
    const pay = new ConfidentialPay();
    const hash = await pay.faucetUsdc(wallet as `0x${string}`);
    await pay.waitForReceipt(hash as `0x${string}`);
    return NextResponse.json({ ok: true, transactionHash: hash }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}