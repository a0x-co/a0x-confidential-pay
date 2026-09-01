import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-2xl">
        <div className="cpay-monolabel flex items-center justify-center gap-2 mb-6">
          <span>// @a0x/confidential-pay</span>
          <span className="text-[#6b8585]">·</span>
          <span className="text-[#6b8585] normal-case tracking-normal">base</span>
          <span className="cpay-cursor" />
        </div>

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] mb-4">
          Send money privately, from this account.
        </h1>
        <p className="cpay-monolabel normal-case tracking-[0.08em] text-[#6b8585] mb-10 max-w-md mx-auto leading-relaxed">
          claim a 30-minute wallet · no email · no account · no persistence · send
          to anyone
        </p>

        <Link
          href="/start"
          className="cpay-button inline-flex items-center gap-2 px-8 py-3 rounded-md no-underline"
        >
          Get a wallet
        </Link>

        <div className="cpay-terminal mt-12 p-5 text-left max-w-md mx-auto">
          <div className="cpay-monolabel mb-3">how it works</div>
          <ul className="space-y-2 text-sm text-[#8fb5b5] font-mono">
            <li>
              <span className="cpay-arrow">▸</span> we mint a fresh wallet, just for you
            </li>
            <li>
              <span className="cpay-arrow">▸</span> it lives for 30 minutes, then vanishes
            </li>
            <li>
              <span className="cpay-arrow">▸</span> no email, no login, no database
            </li>
            <li>
              <span className="cpay-arrow">▸</span> send USDC to any address on Base
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}