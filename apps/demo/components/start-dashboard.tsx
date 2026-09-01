"use client";

import { ConfidentialUSDC } from "@bvdaniel/confidential-pay";
import "@bvdaniel/confidential-pay/ConfidentialUSDC.css";

export function StartDashboard({ wallet }: { wallet: `0x${string}` }) {
  return (
    <div className="space-y-4">
      <div className="cpay-terminal p-5">
        <ConfidentialUSDC
          recipient=""
          amount="0.5"
          endpoint="/api/send"
          sender={wallet}
        />
      </div>

      <form
        action="/api/forget"
        method="POST"
        className="cpay-monolabel text-[11px] tracking-[0.18em] uppercase text-[#6b8585]"
      >
        <button type="submit" className="hover:text-[#ff5c5c] transition-colors">
          forget this wallet →
        </button>
      </form>
    </div>
  );
}