import { ConfidentialUSDC } from "@a0x/confidential-pay";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#070707] text-[#ededed] p-6">
      <div className="w-full max-w-xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a8a8a] mb-2">
          @a0x/confidential-pay · demo
        </p>
        <h1 className="text-2xl font-semibold mb-1">Confidential USDC</h1>
        <p className="text-sm text-[#8a8a8a] mb-8">
          0.5 USDC on Base Sepolia. Wallet auto-created server-side via CDP
          Non-custodial Wallets.
        </p>
        <ConfidentialUSDC
          recipient="0x95F09B69C3E36B9c167304E0C174e0f48e62BD50"
          amount="0.5"
        />
      </div>
    </main>
  );
}