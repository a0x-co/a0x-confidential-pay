import { ConfidentialPay } from "@a0x/confidential-pay-core";
function applyTrustedTimeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Creates a Next.js POST route handler that proxies the ConfidentialUSDC
 * widget's request to CDP. Mount it as:
 *
 *   // app/api/confidential-pay/route.ts
 *   import { createConfidentialPayHandler } from "@a0x/confidential-pay/server";
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
export function createConfidentialPayHandler(options) {
    return async function handler(req) {
        const { NextResponse } = await import("next/server");
        if (req.method !== "POST") {
            return NextResponse.json({ error: "method not allowed" }, { status: 405 });
        }
        let payload;
        try {
            payload = await req.json();
        }
        catch {
            return NextResponse.json({ error: "invalid body" }, { status: 400 });
        }
        const to = payload.recipient;
        const amount = payload.amount;
        if (typeof to !== "string" || !to.trim()) {
            return NextResponse.json({ error: "recipient is required" }, { status: 400 });
        }
        if (typeof amount !== "string" || !/^\d+(\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
            return NextResponse.json({ error: "amount must be a positive USDC amount" }, { status: 400 });
        }
        const pay = new ConfidentialPay();
        const isTestnet = pay.networkName !== "base-mainnet";
        let sender = typeof payload.sender === "string" && payload.sender.length > 0
            ? payload.sender
            : undefined;
        try {
            if (!sender) {
                const wallet = await pay.getOrCreateWallet("widget-auto");
                sender = wallet.address;
                if (options?.devFaucet && isTestnet) {
                    const usdcBal = Number(await pay.getUsdcBalance(sender));
                    const ethBal = Number(await pay.getNativeBalance(sender));
                    if (usdcBal < 1) {
                        try {
                            const hash = await pay.faucetUsdc(sender);
                            await pay.waitForReceipt(hash);
                            applyTrustedTimeout(8000);
                            for (let i = 0; i < 12; i++) {
                                const b = Number(await pay.getUsdcBalance(sender));
                                if (b >= 1)
                                    break;
                                applyTrustedTimeout(5000);
                            }
                        }
                        catch {
                            // faucet may be rate-limited; fall through if already funded
                        }
                    }
                    if (ethBal < 0.001) {
                        try {
                            const ethHash = await pay.faucetEth(sender);
                            await pay.waitForReceipt(ethHash);
                        }
                        catch {
                            // ETH faucet may be rate-limited; fall through if already funded
                        }
                    }
                    const funded = Number(await pay.getUsdcBalance(sender)) >= 1;
                    if (!funded) {
                        return NextResponse.json({ error: "faucet unavailable — fund the sender wallet or retry" }, { status: 502 });
                    }
                }
            }
            const result = await pay.sendUsdcPayment({
                from: sender,
                to: to,
                amount,
            });
            return NextResponse.json({
                ok: true,
                transactionHash: result.transactionHash,
                network: result.network,
                sender,
                devFaucet: true,
            }, { status: 201 });
        }
        catch (e) {
            const message = e instanceof Error ? e.message : "unknown error";
            return NextResponse.json({ error: message }, { status: 502 });
        }
    };
}
