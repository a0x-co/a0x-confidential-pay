import { ConfidentialUSDC } from "@a0x/confidential-pay";
import "@a0x/confidential-pay/ConfidentialUSDC.css";

const RECIPIENT = "0x95F09B69C3E36B9c167304E0C174e0f48e62BD50";
const RECIPIENT_SHORT = `${RECIPIENT.slice(0, 8)}…${RECIPIENT.slice(-6)}`;

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="cpay-monolabel flex items-center gap-2 mb-4">
          <span>// @a0x/confidential-pay</span>
          <span className="text-[#6b8585]">·</span>
          <span className="text-[#6b8585] normal-case tracking-normal">
            live on base sepolia
          </span>
          <span className="cpay-cursor" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)] mb-1">
          Confidential USDC
        </h1>
        <p className="cpay-monolabel normal-case tracking-[0.08em] text-[#6b8585] mb-6">
          drop-in payments · auto-funded wallet · server-held keys
        </p>

        <div className="cpay-monolabel flex items-center gap-2 mb-2 mt-8">
          <span className="cpay-arrow">▸</span>
          <span>recipient</span>
        </div>
        <div className="cpay-hash mb-8 ml-4">{RECIPIENT_SHORT}</div>

        <div className="flex items-center gap-3 mb-2">
          <span className="cpay-arrow">▸</span>
          <span className="cpay-monolabel normal-case tracking-[0.08em] text-[#6b8585]">
            send
          </span>
        </div>
        <div className="cpay-terminal p-5 ml-4">
          <ConfidentialUSDC
            recipient={RECIPIENT}
            amount="0.5"
            endpoint="/api/confidential-pay"
          />
        </div>
      </div>
    </main>
  );
}