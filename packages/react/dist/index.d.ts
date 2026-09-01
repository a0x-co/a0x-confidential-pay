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
export declare function ConfidentialUSDC({ recipient, amount: initialAmount, endpoint, onSuccess, onError, lockedAmount, sender, }: ConfidentialUSDCProps): import("react").JSX.Element;
