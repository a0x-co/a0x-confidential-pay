import type { NextRequest, NextResponse } from "next/server";
/**
 * Creates a Next.js POST route handler that proxies the ConfidentialUSDC
 * widget's request to CDP. Mount it as:
 *
 *   // app/api/confidential-pay/route.ts
 *   import { createConfidentialPayHandler } from "@bvdaniel/confidential-pay/server";
 *   export const POST = createConfidentialPayHandler();
 *   export const runtime = "nodejs";
 *
 * The CDP credentials are read from server env vars:
 *   CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET, CDP_NETWORK
 *
 * When `devFaucet` is true and CDP_NETWORK is a testnet, auto-created sender
 * wallets are funded with testnet ETH and USDC before the first send. Never
 * enable this in production — it exists for sandbox demos.
 */
export declare function createConfidentialPayHandler(options?: {
    devFaucet?: boolean;
}): (req: NextRequest) => Promise<NextResponse>;
