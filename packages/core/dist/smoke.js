import { ConfidentialPay } from "./index.js";
import dotenv from "dotenv";
dotenv.config();
async function main() {
    const pay = new ConfidentialPay();
    console.log(`[smoke] network: ${pay.networkName}`);
    console.log("[smoke] creating smart account...");
    const wallet = await pay.getOrCreateWallet("a0x-demo-smoke");
    console.log(`[smoke] wallet: ${wallet.address}`);
    if (pay.networkName !== "base-mainnet") {
        console.log("[smoke] fauceting USDC...");
        try {
            const hash = await pay.faucetUsdc(wallet.address);
            console.log(`[smoke] faucet tx: ${hash}`);
            const receipt = await pay.waitForReceipt(hash);
            console.log(`[smoke] faucet status: ${receipt.status}`);
        }
        catch (e) {
            console.log(`[smoke] faucet skipped: ${e.message ?? e}`);
        }
        const usdcBalance = await pay.getUsdcBalance(wallet.address);
        console.log(`[smoke] usdc balance: ${usdcBalance}`);
    }
    console.log("[smoke] DONE — credentials valid, smart account created.");
}
main().catch((err) => {
    console.error("[smoke] FAILED:", err.message ?? err);
    process.exit(1);
});
