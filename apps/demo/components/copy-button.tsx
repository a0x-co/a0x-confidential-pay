"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <button
      onClick={copy}
      className="cpay-monolabel text-[10px] tracking-[0.18em] uppercase text-[#6b8585] opacity-50 hover:opacity-100 hover:text-[var(--accent)] transition-opacity transition-colors"
      aria-label="Copy wallet address"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}