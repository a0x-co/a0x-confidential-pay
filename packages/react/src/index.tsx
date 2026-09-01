"use client";

import { useState } from "react";

export type ConfidentialUSDCProps = {
  /** Wallet or email address receiving the payment. */
  recipient: string;
  /** Default amount in USDC (decimal string). */
  amount?: string;
  /** Endpoint that proxies to CDP. Defaults to the conventional /api/confidential-pay. */
  endpoint?: string;
  /** Called with the transaction hash on success. */
  onSuccess?: (txHash: string) => void;
  /** Called with an error message on failure. */
  onError?: (message: string) => void;
  /** Disable edits to the amount. */
  lockedAmount?: boolean;
  /** Supply a sender wallet address if you already have one. Defaults to auto-create. */
  sender?: string;
};

type Status = "idle" | "sending" | "success" | "error";

export function ConfidentialUSDC({
  recipient,
  amount: initialAmount = "1",
  endpoint = "/api/confidential-pay",
  onSuccess,
  onError,
  lockedAmount = false,
  sender,
}: ConfidentialUSDCProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [effectiveSender, setEffectiveSender] = useState<string | undefined>(
    sender,
  );

  async function handlePay() {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, amount, sender: effectiveSender }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setStatus("success");
      setMessage(body.transactionHash);
      onSuccess?.(body.transactionHash);
    } catch (e) {
      setStatus("error");
      const m = e instanceof Error ? e.message : "Unknown error";
      setMessage(m);
      onError?.(m);
    }
  }

  return (
    <div
      className="a0x-cpay"
      style={{
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "20px",
        background: "#0d0d0d",
        color: "#ededed",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        maxWidth: "360px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "#8a8a8a",
          marginBottom: "12px",
        }}
      >
        Confidential USDC · Base
      </div>

      <label
        style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}
      >
        Amount (USDC)
      </label>
      <input
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={amount}
        disabled={lockedAmount || status === "sending"}
        onChange={(e) => setAmount(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #333",
          background: "#0a0a0a",
          color: "#ededed",
          fontSize: "16px",
          marginBottom: "16px",
        }}
        aria-label="Amount in USDC"
      />

      <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "16px" }}>
        To: <span style={{ color: "#f5a623" }}>{recipient}</span>
      </div>

      <button
        onClick={handlePay}
        disabled={status === "sending"}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          background: "#ededed",
          color: "#0d0d0d",
          border: "none",
          fontSize: "15px",
          fontWeight: 600,
          cursor: status === "sending" ? "wait" : "pointer",
        }}
      >
        {status === "sending" ? "Sending…" : `Pay ${amount} USDC`}
      </button>

      {status === "success" ? (
        <div
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: "#4ade80",
            wordBreak: "break-all",
          }}
          role="status"
        >
          Sent. Tx: {message}
        </div>
      ) : null}
      {status === "error" ? (
        <div
          style={{ marginTop: "12px", fontSize: "12px", color: "#f87171" }}
          role="alert"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}