"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function ConfidentialUSDC({ recipient, amount: initialAmount = "1", endpoint = "/api/confidential-pay", onSuccess, onError, lockedAmount = false, sender, }) {
    const [amount, setAmount] = useState(initialAmount);
    const [recipientInput, setRecipientInput] = useState(recipient ?? "");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [effectiveSender, setEffectiveSender] = useState(sender);
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
            if (!res.ok)
                throw new Error(body.error ?? `HTTP ${res.status}`);
            setStatus("success");
            setMessage(body.transactionHash);
            onSuccess?.(body.transactionHash);
        }
        catch (e) {
            setStatus("error");
            const m = e instanceof Error ? e.message : "Unknown error";
            setMessage(m);
            onError?.(m);
        }
    }
    return (_jsxs("div", { className: "cpw", children: [_jsx("div", { className: "cpw-label", children: "Confidential USDC \u00B7 Base" }), _jsx("label", { className: "cpw-field-label", htmlFor: "cpw-recipient", children: "Recipient" }), recipient ? (_jsxs("div", { className: "cpw-recipient", children: ["To: ", _jsx("span", { className: "cpw-recipient-addr", children: recipient })] })) : (_jsx("input", { id: "cpw-recipient", type: "text", inputMode: "text", placeholder: "0x\u2026", value: recipientInput, disabled: status === "sending", onChange: (e) => setRecipientInput(e.target.value), className: "cpw-input", "aria-label": "Recipient wallet address" })), _jsx("label", { className: "cpw-field-label", htmlFor: "cpw-amount", children: "Amount (USDC)" }), _jsx("input", { id: "cpw-amount", type: "number", inputMode: "decimal", min: "0.01", step: "0.01", value: amount, disabled: lockedAmount || status === "sending", onChange: (e) => setAmount(e.target.value), className: "cpw-input", "aria-label": "Amount in USDC" }), _jsx("button", { onClick: handlePay, disabled: status === "sending", className: `cpw-button${status === "sending" ? " is-sending" : ""}`, children: status === "sending" ? "Sending…" : `Pay ${amount} USDC` }), status === "success" ? (_jsxs("div", { className: "cpw-status is-success", role: "status", children: ["Sent. Tx: ", _jsx("span", { className: "cpw-hash", children: message })] })) : null, status === "error" ? (_jsx("div", { className: "cpw-status is-error", role: "alert", children: message })) : null] }));
}
