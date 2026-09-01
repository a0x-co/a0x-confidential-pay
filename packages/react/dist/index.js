"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function ConfidentialUSDC({ recipient, amount: initialAmount = "1", endpoint = "/api/confidential-pay", onSuccess, onError, lockedAmount = false, sender, }) {
    const [amount, setAmount] = useState(initialAmount);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [effectiveSender, setEffectiveSender] = useState(sender);
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
    return (_jsxs("div", { className: "a0x-cpay", style: {
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            padding: "20px",
            background: "#0d0d0d",
            color: "#ededed",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            maxWidth: "360px",
        }, children: [_jsx("div", { style: {
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#8a8a8a",
                    marginBottom: "12px",
                }, children: "Confidential USDC \u00B7 Base" }), _jsx("label", { style: { display: "block", fontSize: "13px", marginBottom: "4px" }, children: "Amount (USDC)" }), _jsx("input", { type: "number", inputMode: "decimal", min: "0.01", step: "0.01", value: amount, disabled: lockedAmount || status === "sending", onChange: (e) => setAmount(e.target.value), style: {
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #333",
                    background: "#0a0a0a",
                    color: "#ededed",
                    fontSize: "16px",
                    marginBottom: "16px",
                }, "aria-label": "Amount in USDC" }), _jsxs("div", { style: { fontSize: "12px", color: "#8a8a8a", marginBottom: "16px" }, children: ["To: ", _jsx("span", { style: { color: "#f5a623" }, children: recipient })] }), _jsx("button", { onClick: handlePay, disabled: status === "sending", style: {
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#ededed",
                    color: "#0d0d0d",
                    border: "none",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: status === "sending" ? "wait" : "pointer",
                }, children: status === "sending" ? "Sending…" : `Pay ${amount} USDC` }), status === "success" ? (_jsxs("div", { style: {
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#4ade80",
                    wordBreak: "break-all",
                }, role: "status", children: ["Sent. Tx: ", message] })) : null, status === "error" ? (_jsx("div", { style: { marginTop: "12px", fontSize: "12px", color: "#f87171" }, role: "alert", children: message })) : null] }));
}
