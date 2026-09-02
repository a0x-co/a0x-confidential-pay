import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-2xl">
        <div className="cpay-monolabel flex items-center justify-center gap-2 mb-6">
          <span>// @a0x/private-pay</span>
          <span className="text-[#6b8585]">·</span>
          <span className="text-[#6b8585] normal-case tracking-normal">base</span>
          <span className="cpay-cursor" />
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-[var(--fg)] mb-6">
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
      </div>
    </main>
  );
}