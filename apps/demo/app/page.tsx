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

        <div className="cpay-blueprint mt-12 p-6 text-left max-w-md mx-auto">
          <span className="cpay-bp-corner cpay-bp-corner-tl" />
          <span className="cpay-bp-corner cpay-bp-corner-tr" />
          <span className="cpay-bp-corner cpay-bp-corner-bl" />
          <span className="cpay-bp-corner cpay-bp-corner-br" />
          <div className="cpay-bp-header">
            <span className="cpay-bp-label">how it works</span>
            <span className="cpay-bp-coord">[ SEQ · 04 ]</span>
          </div>
          <ol className="cpay-bp-steps">
            <li className="cpay-bp-step">
              <span>we mint a fresh wallet, just for you</span>
              <span className="cpay-bp-num">01 / 04</span>
            </li>
            <li className="cpay-bp-step">
              <span>it lives for 30 minutes, then vanishes</span>
              <span className="cpay-bp-num">02 / 04</span>
            </li>
            <li className="cpay-bp-step">
              <span>no email, no login, no database</span>
              <span className="cpay-bp-num">03 / 04</span>
            </li>
            <li className="cpay-bp-step">
              <span>send USDC to any address on Base</span>
              <span className="cpay-bp-num">04 / 04</span>
            </li>
          </ol>
          <div className="cpay-bp-foot">│  END OF SEQUENCE  │</div>
        </div>
      </div>
    </main>
  );
}