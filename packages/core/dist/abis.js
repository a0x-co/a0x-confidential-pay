import { parseUnits } from "viem";
export const WETH_BASE = "0x4200000000000000000000000000000000000006";
export const WETH_BASE_SEPOLIA = "0x4200000000000000000000000000000000000006";
export const SWAP_ROUTER_BASE = "0x2626664c2603336E57B271c5C0b26F421741e481";
export const SWAP_ROUTER_BASE_SEPOLIA = "0x2626664c2603336E57B271c5C0b26F421741e481";
export const UNISWAP_FEE_TIER = 500;
export const GAS_SWAP_USDC = parseUnits("0.005", 6);
export const SWAP_ROUTER_ABI = [
    {
        type: "function",
        name: "exactInputSingle",
        stateMutability: "payable",
        inputs: [
            {
                name: "params",
                type: "tuple",
                internalType: "struct ISwapRouter.ExactInputSingleParams",
                components: [
                    { name: "tokenIn", type: "address", internalType: "address" },
                    { name: "tokenOut", type: "address", internalType: "address" },
                    { name: "fee", type: "uint24", internalType: "uint24" },
                    { name: "recipient", type: "address", internalType: "address" },
                    { name: "amountIn", type: "uint256", internalType: "uint256" },
                    { name: "amountOutMinimum", type: "uint256", internalType: "uint256" },
                    { name: "sqrtPriceLimitX96", type: "uint160", internalType: "uint160" },
                ],
            },
        ],
        outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    },
];
export const ERC20_APPROVE_ABI = [
    {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
];
export function getSwapRouter(network) {
    return network === "base-mainnet"
        ? SWAP_ROUTER_BASE
        : SWAP_ROUTER_BASE_SEPOLIA;
}
export function getWeth(network) {
    return network === "base-mainnet" ? WETH_BASE : WETH_BASE_SEPOLIA;
}
