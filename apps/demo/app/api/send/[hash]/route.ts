import { NextResponse, type NextRequest } from "next/server";
import { ConfidentialPay } from "@bvdaniel/private-pay-core";
import { verifyKp, KP_COOKIE } from "@/lib/kp";

export const runtime = "nodejs";

const HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: { hash: string } },
) {
  const kp = verifyKp(req.cookies.get(KP_COOKIE)?.value);
  if (!kp) {
    return NextResponse.json(
      { error: "no wallet — mint one at /start first" },
      { status: 401 },
    );
  }

  const hash = params.hash;
  if (!HASH_RE.test(hash)) {
    return NextResponse.json({ error: "invalid user op hash" }, { status: 400 });
  }

  try {
    const pay = new ConfidentialPay();
    const status = await pay.getUserOperationStatus(hash as `0x${string}`, kp.name);
    return NextResponse.json(status);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}