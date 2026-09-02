"use client";

import { useEffect, useState, useCallback } from "react";

type Balance = { usdc: string; eth: string };

export function BalanceClient({ wallet }: { wallet: `0x${string}` }) {
  const [data, setData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(false);
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
    const t = setInterval(fetchBalance, 10000);
    return () => clearInterval(t);
  }, [fetchBalance]);

  if (!data) return null;

  const usdc = Number(data.usdc);
  const low = usdc < 1;

  return (
    <div className="flex flex-col items-center gap-1 mb-2">
      <div className="flex items-baseline justify-center gap-2 font-mono">
        <span className="text-3xl font-semibold tabular-nums text-[var(--fg)]">
          {usdc.toFixed(2)}
        </span>
        <span className="cpay-monolabel text-[10px] tracking-[0.22em] text-[#6b8585]">
          usdc
        </span>
      </div>
      <div className="cpay-monolabel text-[10px] tracking-[0.18em] uppercase text-[#6b8585] opacity-60 flex items-center gap-2">
        <span>{Number(data.eth).toFixed(4)} eth</span>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="opacity-50 hover:opacity-100 disabled:opacity-30 transition-opacity"
          aria-label="Refresh balance"
        >
          {loading ? "···" : "↻"}
        </button>
      </div>

      {low ? (
        <button
          onClick={requestFaucet}
          disabled={fauceting}
          className="mt-1 cpay-monolabel text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] border border-[var(--accent-dim)] rounded px-3 py-1 hover:bg-[rgba(0,255,255,0.08)] disabled:opacity-50 transition-colors"
        >
          {fauceting ? "requesting…" : "request testnet faucet"}
        </button>
      ) : (
        <p className="cpay-monolabel text-[9px] tracking-[0.15em] uppercase text-[#6b8585] opacity-50 mt-1">
          funded
        </p>
      )}

      {faucetError ? (
        <p className="font-mono text-[10px] text-[#ff5c5c]">{faucetError}</p>
      ) : null}
    </div>
  );
}