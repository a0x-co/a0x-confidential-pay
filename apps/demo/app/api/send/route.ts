import { NextResponse, type NextRequest } from "next/server";
import { ConfidentialPay } from "@bvdaniel/confidential-pay-core";
import { verifyKp, KP_COOKIE } from "@/lib/kp";

export const runtime = "nodejs";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const AMOUNT_RE = /^\d+(\.\d{1,6})?$/;

export async function POST(req: NextRequest) {
  const kp = verifyKp(req.cookies.get(KP_COOKIE)?.value);
  if (!kp) {
    return NextResponse.json(
      { error: "no wallet — mint one at /start first" },
      { status: 401 },
    );
  }

  let payload: { recipient?: unknown; amount?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const recipient = payload.recipient;
  const amount = payload.amount;
  if (typeof recipient !== "string" || !ADDRESS_RE.test(recipient)) {
    return NextResponse.json({ error: "recipient must be a 0x address" }, { status: 400 });
  }
  if (typeof amount !== "string" || !AMOUNT_RE.test(amount) || Number(amount) <= 0 || Number(amount) > 100) {
    return NextResponse.json({ error: "amount must be a positive USDC amount (max 100)" }, { status: 400 });
  }

  try {
    const pay = new ConfidentialPay();
    await pay.fundOnFirstSend(kp.wallet as `0x${string}`);

    const result = await pay.sendUsdcPayment({
      from: kp.wallet,
      to: recipient as `0x${string}`,
      amount,
    });

    return NextResponse.json(
      {
        ok: true,
        transactionHash: result.transactionHash,
        network: result.network,
        sender: kp.wallet,
      },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}