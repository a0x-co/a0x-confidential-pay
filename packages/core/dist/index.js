import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits, maxUint256, } from "viem";
import { base, baseSepolia } from "viem/chains";
import { ERC20_APPROVE_ABI, getSwapRouter, getWeth, GAS_SWAP_USDC, SWAP_ROUTER_ABI, UNISWAP_FEE_TIER, } from "./abis.js";
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
    walletCache = new Map();
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
     * Creates a new CDP smart account (ERC-4337) with a server-managed owner.
     * The owner is restored on later requests via `name` + `getAccount`.
     */
    async createWallet(name) {
        if (this.walletCache.has(name))
            return this.walletCache.get(name);
        const owner = await this.client.evm.createAccount({
            name: `${name}-owner`,
        });
        const smart = await this.client.evm.getOrCreateSmartAccount({
            name,
            owner,
        });
        const wallet = {
            address: smart.address,
            smartAccount: smart,
            ownerName: `${name}-owner`,
            name,
        };
        this.walletCache.set(name, wallet);
        return wallet;
    }
    /**
     * Restores a previously-created smart account from its name (owner refetched).
     */
    async getSavedWallet(name) {
        if (this.walletCache.has(name))
            return this.walletCache.get(name);
        const owner = await this.client.evm.getAccount({ name: `${name}-owner` });
        const smart = await this.client.evm.getOrCreateSmartAccount({
            name,
            owner,
        });
        const wallet = {
            address: smart.address,
            smartAccount: smart,
            ownerName: `${name}-owner`,
            name,
        };
        this.walletCache.set(name, wallet);
        return wallet;
    }
    /**
     * Get or create a named wallet. Idempotent.
     */
    async getOrCreateWallet(name) {
        return this.createWallet(name);
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
    async sendUsdcPayment(params) {
        const usdc = USDC_ADDRESS[this.network];
        if (!usdc)
            throw new Error(`USDC not configured for network ${this.network}`);
        const router = getSwapRouter(this.network);
        const weth = getWeth(this.network);
        const wallet = await this.getSavedWallet(params.walletName);
        const from = wallet.address;
        const amount = parseUnits(params.amount, 6);
        const approveData = encodeFunctionData({
            abi: ERC20_APPROVE_ABI,
            functionName: "approve",
            args: [router, maxUint256],
        });
        const swapData = encodeFunctionData({
            abi: SWAP_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
                {
                    tokenIn: usdc,
                    tokenOut: weth,
                    fee: UNISWAP_FEE_TIER,
                    recipient: from,
                    amountIn: GAS_SWAP_USDC,
                    amountOutMinimum: 0n,
                    sqrtPriceLimitX96: 0n,
                },
            ],
        });
        const transferData = encodeFunctionData({
            abi: ERC20_TRANSFER_ABI,
            functionName: "transfer",
            args: [params.to, amount],
        });
        const result = await this.client.evm.sendUserOperation({
            smartAccount: wallet.smartAccount,
            calls: [
                { to: usdc, data: approveData, value: BigInt(0) },
                { to: router, data: swapData, value: BigInt(0) },
                { to: usdc, data: transferData, value: BigInt(0) },
            ],
            network: this.network,
        });
        return {
            userOpHash: result.userOpHash,
            network: this.network,
            sender: from,
        };
    }
    /**
     * Resolves the final status of a user operation via a real poll
     * of CDP's getUserOperation (transaction hash is set once included in a block).
     */
    async getUserOperationStatus(userOpHash, walletName) {
        const wallet = await this.getSavedWallet(walletName);
        const op = await this.client.evm.getUserOperation({
            smartAccount: wallet.smartAccount,
            userOpHash,
        });
        if (op.status === "complete" && op.transactionHash) {
            return {
                status: "complete",
                transactionHash: op.transactionHash,
            };
        }
        if (op.status === "failed" || op.status === "dropped") {
            return { status: "failed", error: `user operation ${op.status}` };
        }
        return { status: "pending" };
    }
    /**
     * Funds a wallet for the first time on testnets: USDC if below 1.
     * ETH is NOT needed anymore — sendUsdcPayment self-funds gas via swap.
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
        return Number(await this.getUsdcBalance(address)) >= 1;
    }
}
