import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";
dotenv.config();
const ws = process.env.TEST_WALLET_SECRET ?? "";
async function main() {
  const cdp = new CdpClient({ walletSecret: ws });
  const account = await cdp.evm.createAccount({ name: "wallet-secret-test" });
  console.log("OK wallet created:", account.address);
}
main().then(() => process.exit(0)).catch((e) => { console.error("FAIL:", e.message ?? e); process.exit(1); });
