import { type Address } from "viem";
export declare const WETH_BASE: Address;
export declare const WETH_BASE_SEPOLIA: Address;
export declare const SWAP_ROUTER_BASE: Address;
export declare const SWAP_ROUTER_BASE_SEPOLIA: Address;
export declare const UNISWAP_FEE_TIER = 500;
export declare const GAS_SWAP_USDC: bigint;
export declare const SWAP_ROUTER_ABI: readonly [{
    readonly type: "function";
    readonly name: "exactInputSingle";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "params";
        readonly type: "tuple";
        readonly internalType: "struct ISwapRouter.ExactInputSingleParams";
        readonly components: readonly [{
            readonly name: "tokenIn";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenOut";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "fee";
            readonly type: "uint24";
            readonly internalType: "uint24";
        }, {
            readonly name: "recipient";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "amountIn";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "amountOutMinimum";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "sqrtPriceLimitX96";
            readonly type: "uint160";
            readonly internalType: "uint160";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
}];
export declare const ERC20_APPROVE_ABI: readonly [{
    readonly type: "function";
    readonly name: "approve";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}];
export declare function getSwapRouter(network: string): Address;
export declare function getWeth(network: string): Address;
