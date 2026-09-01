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
  const [recipientInput, setRecipientInput] = useState(recipient ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [effectiveSender, setEffectiveSender] = useState<string | undefined>(
    sender,
  );

  const to = recipient || recipientInput;

  async function handlePay() {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: to, amount, sender: effectiveSender }),
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
    <div className="cpw">
      <div className="cpw-label">Confidential USDC · Base</div>

      <label className="cpw-field-label" htmlFor="cpw-recipient">
        Recipient
      </label>
      {recipient ? (
        <div className="cpw-recipient">
          To: <span className="cpw-recipient-addr">{recipient}</span>
        </div>
      ) : (
        <input
          id="cpw-recipient"
          type="text"
          inputMode="text"
          placeholder="0x…"
          value={recipientInput}
          disabled={status === "sending"}
          onChange={(e) => setRecipientInput(e.target.value)}
          className="cpw-input"
          aria-label="Recipient wallet address"
        />
      )}

      <label className="cpw-field-label" htmlFor="cpw-amount">
        Amount (USDC)
      </label>
      <input
        id="cpw-amount"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={amount}
        disabled={lockedAmount || status === "sending"}
        onChange={(e) => setAmount(e.target.value)}
        className="cpw-input"
        aria-label="Amount in USDC"
      />

      <button
        onClick={handlePay}
        disabled={status === "sending"}
        className={`cpw-button${status === "sending" ? " is-sending" : ""}`}
      >
        {status === "sending" ? "Sending…" : `Pay ${amount} USDC`}
      </button>

      {status === "success" ? (
        <div className="cpw-status is-success" role="status">
          Sent. Tx: <span className="cpw-hash">{message}</span>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="cpw-status is-error" role="alert">
          {message}
        </div>
      ) : null}
    </div>
  );
}