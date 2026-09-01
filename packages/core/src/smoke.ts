import { ConfidentialPay } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const pay = new ConfidentialPay();
  console.log(`[smoke] network: ${pay.networkName}`);

  console.log("[smoke] creating wallet...");
  const wallet = await pay.getOrCreateWallet("confidential-pay-smoke");
  console.log(`[smoke] wallet: ${wallet.address}`);

  if (pay.networkName !== "base-mainnet") {
    console.log("[smoke] fauceting ETH...");
    const hash = await pay.faucetEth(wallet.address);
    console.log(`[smoke] faucet tx: ${hash}`);

    console.log("[smoke] waiting for faucet receipt...");
    const receipt = await pay.waitForReceipt(hash);
    console.log(`[smoke] faucet status: ${receipt.status}`);

    const usdcBalance = await pay.getUsdcBalance(wallet.address);
    console.log(`[smoke] usdc balance: ${usdcBalance}`);
  }

  console.log("[smoke] DONE — credentials valid, wallet created.");
}

main().catch((err) => {
  console.error("[smoke] FAILED:", err.message ?? err);
  process.exit(1);
});