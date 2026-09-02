import { cookies } from "next/headers";
import { verifyKp, KP_TTL_S } from "@/lib/kp";
import { StartDashboard } from "@/components/start-dashboard";

export const runtime = "nodejs";

function fmtShort(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default async function StartPage() {
  const store = await cookies();
  const kp = verifyKp(store.get("kp")?.value);
  const now = Math.floor(Date.now() / 1000);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="cpay-monolabel flex items-center gap-2 mb-8">
          <span>// @a0x/private-pay</span>
          <span className="text-[#6b8585]">·</span>
          <span className="text-[#6b8585] normal-case tracking-normal">your wallet</span>
          <span className="cpay-cursor" />
        </div>

        {kp && kp.iat > now - KP_TTL_S ? (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg)] mb-1">
              Send privately.
            </h1>
            <p className="cpay-monolabel text-[11px] tracking-[0.18em] uppercase text-[#6b8585] mb-2">
              wallet · {fmtShort(kp.wallet)}
            </p>
            <div className="cpay-hash mb-6">{kp.wallet}</div>
            <StartDashboard wallet={kp.wallet} />
          </div>
        ) : (
          <MintPrompt />
        )}
      </div>
    </main>
  );
}

function MintPrompt() {
  return (
    <div className="text-center">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--fg)] mb-3">
        Claim a 30-minute wallet
      </h1>
      <p className="text-sm text-[#8fb5b5] mb-12 leading-relaxed max-w-md mx-auto">
        We mint a fresh CDP-managed wallet just for you. No email, no account, no
        database. It funds itself on first send and vanishes after 30 minutes.
      </p>
      <form action="/api/start" method="POST" className="mb-16">
        <button type="submit" className="cpay-button">
          Mint my wallet
        </button>
      </form>
      <p className="cpay-monolabel text-[11px] tracking-[0.18em] uppercase text-[#6b8585]">
        expires · 30 min · no persistence · refresh = new wallet
      </p>
    </div>
  );
}