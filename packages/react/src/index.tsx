"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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

type Status = "idle" | "sending" | "settling" | "success" | "error";

type PostResponse = {
  ok?: boolean;
  userOpHash?: string;
  transactionHash?: string;
  error?: string;
};

type StatusResponse = {
  status?: "complete" | "pending" | "failed";
  transactionHash?: string;
  error?: string;
};

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const to = recipient || recipientInput;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    async (userOpHash: string) => {
      try {
        const res = await fetch(`${endpoint}/${userOpHash}`);
        const body: StatusResponse = await res.json();
        if (body.status === "complete" && body.transactionHash) {
          stopPolling();
          setStatus("success");
          setMessage(body.transactionHash);
          onSuccess?.(body.transactionHash);
        } else if (body.status === "failed") {
          stopPolling();
          setStatus("error");
          setMessage(body.error ?? "transaction failed");
          onError?.(body.error ?? "transaction failed");
        }
      } catch {
        // transient network error — keep polling
      }
    },
    [endpoint, onSuccess, onError, stopPolling],
  );

  async function handlePay() {
    setStatus("sending");
    setMessage("");
    stopPolling();
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: to, amount, sender: effectiveSender }),
      });
      const body: PostResponse = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);

      if (body.userOpHash) {
        // Async user operation — poll status until settled.
        setStatus("settling");
        setMessage("broadcasting…");
        const hash = body.userOpHash;
        pollRef.current = setInterval(() => pollStatus(hash), 4000);
        return;
      }

      // Legacy synchronous response — done immediately.
      setStatus("success");
      setMessage(body.transactionHash ?? "sent");
      body.transactionHash && onSuccess?.(body.transactionHash);
    } catch (e) {
      setStatus("error");
      const m = e instanceof Error ? e.message : "Unknown error";
      setMessage(m);
      onError?.(m);
    }
  }

  useEffect(() => stopPolling, [stopPolling]);

  const buttonLabel =
    status === "sending"
      ? "Broadcasting…"
      : status === "settling"
        ? "Confirming…"
        : `Pay ${amount} USDC`;

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
          disabled={status === "sending" || status === "settling"}
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
        disabled={
          lockedAmount || status === "sending" || status === "settling"
        }
        onChange={(e) => setAmount(e.target.value)}
        className="cpw-input"
        aria-label="Amount in USDC"
      />

      <button
        onClick={handlePay}
        disabled={status === "sending" || status === "settling"}
        className={`cpw-button${status === "sending" || status === "settling" ? " is-sending" : ""}`}
      >
        {buttonLabel}
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