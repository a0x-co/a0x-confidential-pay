import { type EvmSmartAccount } from "@coinbase/cdp-sdk";
export declare const USDC_ADDRESS: Record<string, `0x${string}`>;
export declare const CHAIN: Record<string, any>;
export interface ConfidentialPayOptions {
    apiKeyId?: string;
    apiKeySecret?: string;
    walletSecret?: string;
    network?: string;
}
export interface Wallet {
    address: `0x${string}`;
    smartAccount: EvmSmartAccount;
    ownerName: string;
    name: string;
}
export declare class ConfidentialPay {
    private client;
    private network;
    private publicClient;
    private walletCache;
    constructor(options?: ConfidentialPayOptions);
    get networkName(): string;
    /**
     * Creates a new CDP smart account (ERC-4337) with a server-managed owner.
     * The owner is restored on later requests via `name` + `getAccount`.
     */
    createWallet(name: string): Promise<Wallet>;
    /**
     * Restores a previously-created smart account from its name (owner refetched).
     */
    getSavedWallet(name: string): Promise<Wallet>;
    /**
     * Get or create a named wallet. Idempotent.
     */
    getOrCreateWallet(name: string): Promise<Wallet>;
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
     * Sends a USDC payment from a smart account to a recipient.
     *
     * Gasless for the user: one user operation batches three calls atomically:
     *   1. approve(USDC, SwapRouter, MAX)
     *   2. SwapRouter.exactInputSingle(0.005 USDC → ETH)  — self-funded gas
     *   3. transfer(USDC, recipient, amount)
     *
     * Returns the user operation hash (not a tx hash yet). Poll
     * `getUserOperationStatus(userOpHash, address)` for the final tx hash.
     */
    sendUsdcPayment(params: {
        walletName: string;
        to: `0x${string}`;
        amount: string;
    }): Promise<{
        userOpHash: `0x${string}`;
        network: string;
        sender: `0x${string}`;
    }>;
    /**
     * Resolves the final status of a user operation via a real poll
     * of CDP's getUserOperation (transaction hash is set once included in a block).
     */
    getUserOperationStatus(userOpHash: `0x${string}`, walletName: string): Promise<{
        status: "complete";
        transactionHash: `0x${string}`;
        error?: undefined;
    } | {
        status: "failed";
        error: string;
        transactionHash?: undefined;
    } | {
        status: "pending";
        transactionHash?: undefined;
        error?: undefined;
    }>;
    /**
     * Funds a wallet for the first time on testnets: USDC if below 1.
     * ETH is NOT needed anymore — sendUsdcPayment self-funds gas via swap.
     */
    fundOnFirstSend(address: `0x${string}`): Promise<boolean>;
}
