import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { base, baseSepolia } from "viem/chains";
export const USDC_ADDRESS = {
    "base-mainnet": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};
export const CHAIN = {
    "base-mainnet": base,
    "base-sepolia": baseSepolia,
};
const ERC20_TRANSFER_ABI = [
    {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
];
const ERC20_BALANCE_ABI = [
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
];
function applyTimeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export class ConfidentialPay {
    client;
    network;
    publicClient;
    constructor(options = {}) {
        this.client = new CdpClient({
            apiKeyId: options.apiKeyId || process.env.CDP_API_KEY_ID,
            apiKeySecret: options.apiKeySecret || process.env.CDP_API_KEY_SECRET,
            walletSecret: options.walletSecret || process.env.CDP_WALLET_SECRET,
        });
        this.network = options.network || process.env.CDP_NETWORK || "base-sepolia";
        const chain = CHAIN[this.network];
        if (!chain)
            throw new Error(`Unsupported network: ${this.network}`);
        this.publicClient = createPublicClient({
            chain,
            transport: http(),
        });
    }
    get networkName() {
        return this.network;
    }
    /**
     * Creates a new server-controlled EOA on Base.
     */
    async createWallet(name) {
        const account = await this.client.evm.createAccount({ name });
        return { address: account.address };
    }
    /**
     * Get or create a named wallet. Idempotent.
     */
    async getOrCreateWallet(name) {
        const account = await this.client.evm.getOrCreateAccount({ name });
        return { address: account.address };
    }
    /**
     * Requests testnet ETH from the CDP faucet (only works on testnets).
     */
    async faucetEth(address) {
        if (this.network === "base-mainnet") {
            throw new Error("Faucet is only available on testnets.");
        }
        const res = await this.client.evm.requestFaucet({
            address,
            network: "base-sepolia",
            token: "eth",
        });
        return res.transactionHash;
    }
    /**
     * Requests testnet USDC from the CDP faucet (only works on testnets).
     */
    async faucetUsdc(address) {
        if (this.network === "base-mainnet") {
            throw new Error("Faucet is only available on testnets.");
        }
        const res = await this.client.evm.requestFaucet({
            address,
            network: "base-sepolia",
            token: "usdc",
        });
        return res.transactionHash;
    }
    /**
     * Waits for a transaction to reach finality on the configured network.
     */
    async waitForReceipt(txHash) {
        return this.publicClient.waitForTransactionReceipt({ hash: txHash });
    }
    /**
     * Gets the USDC balance for a wallet address.
     */
    async getUsdcBalance(address) {
        const usdc = USDC_ADDRESS[this.network];
        if (!usdc)
            throw new Error(`USDC not configured for network ${this.network}`);
        const balance = await this.publicClient.readContract({
            address: usdc,
            abi: ERC20_BALANCE_ABI,
            functionName: "balanceOf",
            args: [address],
        });
        return formatUnits(balance, 6);
    }
    /**
     * Gets the native ETH balance for a wallet address (for gas).
     */
    async getNativeBalance(address) {
        const balance = await this.publicClient.getBalance({ address });
        return formatUnits(balance, 18);
    }
    /**
     * Sends a USDC payment from a wallet address to a recipient.
     * Returns the transaction hash.
     */
    async sendUsdcPayment(params) {
        const usdc = USDC_ADDRESS[this.network];
        if (!usdc)
            throw new Error(`USDC not configured for network ${this.network}`);
        const amount = parseUnits(params.amount, 6);
        const data = encodeFunctionData({
            abi: ERC20_TRANSFER_ABI,
            functionName: "transfer",
            args: [params.to, amount],
        });
        const res = await this.client.evm.sendTransaction({
            address: params.from,
            transaction: {
                to: usdc,
                data,
                value: BigInt(0),
            },
            network: this.network,
        });
        return {
            transactionHash: res.transactionHash,
            network: this.network,
        };
    }
    /**
     * Funds a wallet for the first time on testnets: USDC if below 1, ETH gas if below 0.001.
     * Skips both if already funded. Fails silently on faucet rate-limits.
     * @returns true if the wallet holds >= 1 USDC after this call.
     */
    async fundOnFirstSend(address) {
        if (this.network === "base-mainnet")
            return true;
        try {
            const usdc = Number(await this.getUsdcBalance(address));
            if (usdc < 1) {
                const hash = await this.faucetUsdc(address);
                await this.waitForReceipt(hash);
            }
            // Poll until USDC is visible on-chain (faucet credit and CDP's view lag on new wallets).
            await applyTimeout(15000);
            for (let i = 0; i < 12; i++) {
                if (Number(await this.getUsdcBalance(address)) >= 1)
                    break;
                await applyTimeout(5000);
            }
        }
        catch {
            // faucet rate-limited — fall through, caller retries
        }
        try {
            const eth = Number(await this.getNativeBalance(address));
            if (eth < 0.001) {
                const hash = await this.faucetEth(address);
                await this.waitForReceipt(hash);
                await applyTimeout(5000);
            }
        }
        catch {
            // ETH faucet rate-limited — fall through
        }
        return Number(await this.getUsdcBalance(address)) >= 1;
    }
}
