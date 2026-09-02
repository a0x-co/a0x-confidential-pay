import { ConfidentialPay } from "./index.js";
import dotenv from "dotenv";
dotenv.config();
async function pollBalance(pay, address, attempts) {
    let received = "0";
    for (let i = 0; i < attempts; i++) {
        received = await pay.getUsdcBalance(address);
        if (Number(received) > 0)
            break;
        await new Promise((s) => setTimeout(s, 5000));
    }
    return received;
}
async function main() {
    const pay = new ConfidentialPay();
    console.log(`[transfer] network: ${pay.networkName}`);
    const sender = await pay.getOrCreateWallet("a0x-demo-sender-test");
    const receiver = await pay.getOrCreateWallet("a0x-demo-receiver-test");
    console.log(`[transfer] sender:   ${sender.address}`);
    console.log(`[transfer] receiver: ${receiver.address}`);
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
    const received = await pollBalance(pay, sender.address, 6);
    console.log(`[transfer] sender USDC after faucet: ${received}`);
    console.log("[transfer] sending 0.5 USDC (self-funded gas via swap)...");
    const tx = await pay.sendUsdcPayment({
        walletName: sender.name,
        to: receiver.address,
        amount: "0.5",
    });
    console.log(`[transfer] userOpHash: ${tx.userOpHash}`);
    console.log("[transfer] waiting for user operation to complete...");
    for (let i = 0; i < 20; i++) {
        await new Promise((s) => setTimeout(s, 3000));
        const status = await pay.getUserOperationStatus(tx.userOpHash, sender.name);
        if (status.status === "complete") {
            console.log(`[transfer] confirmed — tx: ${status.transactionHash}`);
            break;
        }
        if (i === 19) {
            console.log("[transfer] still pending after 60s — investigate");
            process.exitCode = 1;
        }
    }
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
