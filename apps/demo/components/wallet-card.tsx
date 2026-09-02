"use client";

import { useEffect, useState, useCallback } from "react";
import { CopyButton } from "@/components/copy-button";

type Balance = { usdc: string; eth: string };
type State = "empty" | "funded";
type Urgency = "ok" | "warning" | "critical";

function short(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function WalletCard({
  wallet,
  iat,
  ttlSeconds,
}: {
  wallet: `0x${string}`;
  iat: number;
  ttlSeconds: number;
}) {
  const [data, setData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  const [fauceting, setFauceting] = useState(false);
  const [faucetError, setFaucetError] = useState("");

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/balance?wallet=${wallet}`);
      if (res.ok) {
        const j = await res.json();
        setData(j);
      }
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const requestFaucet = useCallback(async () => {
    setFauceting(true);
    setFaucetError("");
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      await fetchBalance();
    } catch (e) {
      setFaucetError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setFauceting(false);
    }
  }, [wallet, fetchBalance]);

  useEffect(() => {
    fetchBalance();
    const bal = setInterval(fetchBalance, 10000);
    const clock = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => {
      clearInterval(bal);
      clearInterval(clock);
    };
  }, [fetchBalance]);

  const usdc = data ? Number(data.usdc) : 0;
  const eth = data ? Number(data.eth) : 0;
  const state: State = usdc >= 1 ? "funded" : "empty";
  const remaining = Math.max(0, iat + ttlSeconds - now);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const urgency: Urgency =
    remaining <= 60 ? "critical" : remaining <= 300 ? "warning" : "ok";

  return (
    <div className="cpay-wallet-card">
      <span
        className="cpay-wallet-badge"
        data-state={state}
        role="status"
      >
        {state === "funded" ? "funded" : "empty"}
      </span>

      <p className="cpay-monolabel text-[11px] tracking-[0.18em] uppercase text-[#6b8585] mb-4">
        wallet · {short(wallet)} ·{" "}
        <span className="cpay-wallet-countdown" data-urgency={urgency}>
          expires {mm}:{ss}
        </span>
      </p>

      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="cpay-hash">{wallet}</div>
        <CopyButton text={wallet} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline justify-center gap-2 font-mono">
          <span className="text-3xl font-semibold tabular-nums text-[var(--fg)]">
            {usdc.toFixed(2)}
          </span>
          <span className="cpay-monolabel text-[10px] tracking-[0.22em] text-[#6b8585]">
            usdc
          </span>
        </div>
        <div className="cpay-monolabel text-[10px] tracking-[0.18em] uppercase text-[#6b8585] opacity-60 flex items-center gap-2">
          <span>{eth.toFixed(4)} eth</span>
          <span className="opacity-50">· gas auto</span>
          <button
            onClick={fetchBalance}
            disabled={loading}
            className="opacity-50 hover:opacity-100 disabled:opacity-30 transition-opacity"
            aria-label="Refresh balance"
          >
            {loading ? "···" : "↻"}
          </button>
        </div>

        {state === "empty" ? (
          <button
            onClick={requestFaucet}
            disabled={fauceting}
            className="cpay-wallet-faucet"
          >
            {fauceting ? "requesting…" : "request testnet faucet"}
          </button>
        ) : null}

        {faucetError ? (
          <p className="font-mono text-[10px] text-[#ff5c5c] mt-1">
            {faucetError}
          </p>
        ) : null}
      </div>
    </div>
  );
}