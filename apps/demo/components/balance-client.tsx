"use client";

import { useEffect, useState, useCallback } from "react";

type Balance = { usdc: string; eth: string };

export function BalanceClient({ wallet }: { wallet: `0x${string}` }) {
  const [data, setData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchBalance();
    const t = setInterval(fetchBalance, 10000);
    return () => clearInterval(t);
  }, [fetchBalance]);

  if (!data) return null;

  return (
    <div className="cpay-monolabel text-[11px] tracking-[0.18em] uppercase text-[#6b8585] mb-2 flex items-center justify-center gap-3">
      <span>
        balance · {Number(data.usdc).toFixed(2)} usdc · {Number(data.eth).toFixed(4)} eth
      </span>
      <button
        onClick={fetchBalance}
        disabled={loading}
        className="opacity-50 hover:opacity-100 disabled:opacity-30 transition-opacity"
        aria-label="Refresh balance"
      >
        {loading ? "···" : "↻"}
      </button>
    </div>
  );
}