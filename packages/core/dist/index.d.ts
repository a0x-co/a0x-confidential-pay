export declare const USDC_ADDRESS: Record<string, `0x${string}`>;
export declare const CHAIN: Record<string, any>;
export interface ConfidentialPayOptions {
    apiKeyId?: string;
    apiKeySecret?: string;
    walletSecret?: string;
    network?: string;
}
export declare class ConfidentialPay {
    private client;
    private network;
    private publicClient;
    constructor(options?: ConfidentialPayOptions);
    get networkName(): string;
    /**
     * Creates a new server-controlled EOA on Base.
     */
    createWallet(name?: string): Promise<{
        address: `0x${string}`;
    }>;
    /**
     * Get or create a named wallet. Idempotent.
     */
    getOrCreateWallet(name: string): Promise<{
        address: `0x${string}`;
    }>;
    /**
     * Requests testnet ETH from the CDP faucet (only works on testnets).
     */
    faucetEth(address: `0x${string}`): Promise<`0x${string}`>;
    /**
     * Requests testnet USDC from the CDP faucet (only works on testnets).
     */
    faucetUsdc(address: `0x${string}`): Promise<`0x${string}`>;
    /**
     * Waits for a transaction to reach finality on the configured network.
     */
    waitForReceipt(txHash: `0x${string}`): Promise<any>;
    /**
     * Gets the USDC balance for a wallet address.
     */
    getUsdcBalance(address: `0x${string}`): Promise<string>;
    /**
     * Gets the native ETH balance for a wallet address (for gas).
     */
    getNativeBalance(address: `0x${string}`): Promise<string>;
    /**
     * Sends a USDC payment from a wallet address to a recipient.
     * Returns the transaction hash.
     */
    sendUsdcPayment(params: {
        from: `0x${string}`;
        to: `0x${string}`;
        amount: string;
    }): Promise<{
        transactionHash: `0x${string}`;
        network: string;
    }>;
}
