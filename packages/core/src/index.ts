import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { base, baseSepolia } from "viem/chains";

export const USDC_ADDRESS: Record<string, `0x${string}`> = {
  "base-mainnet": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

export const CHAIN: Record<string, any> = {
  "base-mainnet": base,
  "base-sepolia": baseSepolia,
};

const ERC20_TRANSFER_ABI = [
  {
    type: "function" as const,
    name: "transfer",
    stateMutability: "nonpayable" as const,
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

const ERC20_BALANCE_ABI = [
  {
    type: "function" as const,
    name: "balanceOf",
    stateMutability: "view" as const,
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

export interface ConfidentialPayOptions {
  apiKeyId?: string;
  apiKeySecret?: string;
  walletSecret?: string;
  network?: string;
}

export class ConfidentialPay {
  private client: CdpClient;
  private network: string;
  private publicClient;

  constructor(options: ConfidentialPayOptions = {}) {
    this.client = new CdpClient({
      apiKeyId: options.apiKeyId || process.env.CDP_API_KEY_ID,
      apiKeySecret: options.apiKeySecret || process.env.CDP_API_KEY_SECRET,
      walletSecret: options.walletSecret || process.env.CDP_WALLET_SECRET,
    });
    this.network = options.network || process.env.CDP_NETWORK || "base-sepolia";

    const chain = CHAIN[this.network];
    if (!chain) throw new Error(`Unsupported network: ${this.network}`);
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
  async createWallet(name?: string) {
    const account = await this.client.evm.createAccount({ name });
    return { address: account.address };
  }

  /**
   * Get or create a named wallet. Idempotent.
   */
  async getOrCreateWallet(name: string) {
    const account = await this.client.evm.getOrCreateAccount({ name });
    return { address: account.address };
  }

  /**
   * Requests testnet ETH from the CDP faucet (only works on testnets).
   */
  async faucetEth(address: `0x${string}`) {
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
  async faucetUsdc(address: `0x${string}`) {
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
  async waitForReceipt(txHash: `0x${string}`) {
    return this.publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  /**
   * Gets the USDC balance for a wallet address.
   */
  async getUsdcBalance(address: `0x${string}`) {
    const usdc = USDC_ADDRESS[this.network];
    if (!usdc) throw new Error(`USDC not configured for network ${this.network}`);
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
  async getNativeBalance(address: `0x${string}`) {
    const balance = await this.publicClient.getBalance({ address });
    return formatUnits(balance, 18);
  }

  /**
   * Sends a USDC payment from a wallet address to a recipient.
   * Returns the transaction hash.
   */
  async sendUsdcPayment(params: {
    from: `0x${string}`;
    to: `0x${string}`;
    amount: string;
  }) {
    const usdc = USDC_ADDRESS[this.network];
    if (!usdc) throw new Error(`USDC not configured for network ${this.network}`);

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
      network: this.network as any,
    });

    return {
      transactionHash: res.transactionHash,
      network: this.network,
    };
  }
}