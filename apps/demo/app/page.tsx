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

        <ol className="cpay-steps mt-12 text-left max-w-md mx-auto">
          <li className="cpay-step">
            <span className="cpay-step-num">01</span>
            <span className="cpay-step-desc">we mint a fresh wallet, just for you</span>
          </li>
          <li className="cpay-step">
            <span className="cpay-step-num">02</span>
            <span className="cpay-step-desc">it lives for 30 minutes, then vanishes</span>
          </li>
          <li className="cpay-step">
            <span className="cpay-step-num">03</span>
            <span className="cpay-step-desc">no email, no login, no database</span>
          </li>
          <li className="cpay-step">
            <span className="cpay-step-num">04</span>
            <span className="cpay-step-desc">send USDC to any address on Base</span>
          </li>
        </ol>
      </div>
    </main>
  );
}