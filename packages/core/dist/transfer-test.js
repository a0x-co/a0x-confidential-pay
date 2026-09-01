import { ConfidentialPay } from "./index.js";
import dotenv from "dotenv";
dotenv.config();
async function main() {
    const pay = new ConfidentialPay();
    console.log(`[transfer] network: ${pay.networkName}`);
    const sender = await pay.getOrCreateWallet("sender");
    const receiver = await pay.getOrCreateWallet("receiver");
    console.log(`[transfer] sender:   ${sender.address}`);
    console.log(`[transfer] receiver: ${receiver.address}`);
    console.log("[transfer] fauceting ETH + USDC...");
    try {
        const ethHash = await pay.faucetEth(sender.address);
        console.log(`[transfer] ETH faucet tx: ${ethHash}`);
        await pay.waitForReceipt(ethHash);
    }
    catch (e) {
        console.log(`[transfer] ETH faucet skipped: ${e.message ?? e}`);
    }
    const senderBal = await pay.getUsdcBalance(sender.address);
    console.log(`[transfer] sender USDC before: ${senderBal}`);
    if (Number(senderBal) < 1) {
        try {
            const hash = await pay.faucetUsdc(sender.address);
            console.log(`[transfer] faucet tx: ${hash}`);
            await pay.waitForReceipt(hash);
        }
        catch (e) {
            console.log(`[transfer] faucet skipped: ${e.message ?? e}`);
            return;
        }
    }
    // Faucet balance can lag the receipt — poll up to 30s.
    let received = "0";
    for (let i = 0; i < 6; i++) {
        received = await pay.getUsdcBalance(sender.address);
        if (Number(received) > 0)
            break;
        await new Promise((s) => setTimeout(s, 5000));
    }
    console.log(`[transfer] sender USDC after faucet: ${received}`);
    console.log("[transfer] sending 0.5 USDC...");
    const tx = await pay.sendUsdcPayment({
        from: sender.address,
        to: receiver.address,
        amount: "0.5",
    });
    console.log(`[transfer] tx: ${tx.transactionHash}`);
    const receipt = await pay.waitForReceipt(tx.transactionHash);
    console.log(`[transfer] status: ${receipt.status}`);
    const senderAfter = await pay.getUsdcBalance(sender.address);
    const receiverAfter = await pay.getUsdcBalance(receiver.address);
    console.log(`[transfer] sender USDC after:   ${senderAfter}`);
    console.log(`[transfer] receiver USDC after: ${receiverAfter}`);
    if (Number(receiverAfter) > 0) {
        console.log("[transfer] SUCCESS — USDC transfer confirmed on Base Sepolia");
    }
    else {
        console.log("[transfer] receiver balance unchanged — investigate");
    }
}
main().catch((err) => {
    console.error("[transfer] FAILED:", err.message ?? err);
    process.exit(1);
});
