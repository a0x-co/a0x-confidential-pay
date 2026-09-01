import { createConfidentialPayHandler } from "@a0x/confidential-pay/server";

export const runtime = "nodejs";

export const POST = createConfidentialPayHandler({ devFaucet: true });