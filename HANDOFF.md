# Handoff — a0x-private-pay

> State for the agent picking this up. Read the first 5 lines for "where we are"; the full file for everything else.

## Where we are (read this first)

We shipped a working end-to-end demo of `@bvdaniel/private-pay` — a drop-in React component for private USDC payments on Base. Each visitor lands on the page, claims a 30-minute ephemeral wallet (no email, no account, no DB), and sends USDC from that wallet to any address on Base Sepolia.

- **Live:** https://a0x-confidential-pay-demo-2w42vltmu-bvdaniels-projects.vercel.app
- **Repo:** github.com/a0x-co/a0x-private-pay (renamed from a0x-confidential-pay — Vercel redirects)
- **Vercel project:** `a0x-confidential-pay-demo` (id `prj_ssLOsHiSIp7sjPqYOGLlrv2XVWWr`)
- **What works end-to-end:** confirmed live, tx `0x0feb9e27eeb7a113f7a1eb00bdfaf94aa6ee34798d74fb29dcaf012726fab7fb` on Base Sepolia
- **Published to npm:** `@bvdaniel/private-pay@0.3.0` + `@bvdaniel/private-pay-core@0.3.0` (old `@bvdaniel/confidential-pay*` + v0.2.0 deprecated)
- **Gasless onchain:** sends are CDP smart accounts (ERC-4337) — a batched user op approves USDC to Uniswap V3, swaps 0.005 USDC → ETH, and transfers USDC. **No ETH needed**; verified live on Base Sepolia (tx `0x378ea986da3b210558bf5462081daf7159d063094a7c564790b7ba52cbb7d6f3`, sender started at 0 ETH).
- **What's left:** swap the public ERC-20 transfer for a confidential one via Base Ledgers (Track B)

The flow is verified: visitor mints → dashboard shows a fresh wallet → enter recipient + amount → pay → user op settles on Base Sepolia, gas self-funded via in-op swap. Server is stateless; the 30-min identity is an HMAC-signed cookie that now also carries the wallet `name` (owner is re-fetched by CDP on each request).

## Decisions locked (single source of truth — don't relitigate without reading this)

| Decision | Rationale |
|---|---|
| **No email, no third-party identity** | User wants "send money from this account we gave you, privately". Email leaks identity and adds a third party. Magic-link email was explicitly rejected. |
| **HMAC-signed cookie, not a session DB** | Stateless; survives serverless cold starts; one env var (`KP_SECRET`) instead of a session table. Cookie holds `{wallet, jti, iat}`, 30-min Max-Age. |
| **30-min wallet lifetime, no persistence** | Honors the privacy promise. Refresh = new wallet. Forget button = same effect. |
| **One visitor = one fresh CDP wallet** | No shared `widget-auto` anymore; the shared-wallet pattern leaked sends across testers. |
| **Testnet-only auto-fund** | `fundOnFirstSend` faucets USDC + ETH only on testnets. Mainnet has no dev faucet. |
| **Public ERC-20 now; confidential is a path, not a switch** | Track B (CDP Payments onboarding) gates real confidentiality. The send route does not pretend otherwise. |
| **Cyberpunk cyan/glass + self-hosted fonts** | Locked when the user said "give me cyberpunk". CSS in `apps/demo/app/globals.css` + `packages/react/src/ConfidentialUSDC.css`. |
| **Testnet = Base Sepolia; mainnet Phase A explicitly deferred** | Sandbox keeps cost zero and avoids regulatory surface while the primitive is untested. |
| **The prior "agent infra" is dropped** | The agent → trading-execution infra from the earlier strategy doc is not reused. This wallet infra is intentionally tiny. |
| **No lightweight analytics (even Plausible)** | Privacy posture forbids them. |

## Verified green

- Local mint + send + receipt: tx `0xa9e4d2f6e5e22fb263d07410af69f8a95485f858f0bf134edd5ee43f97130b09`
- Live mint + send + receipt: tx `0x0feb9e27eeb7a113f7a1eb00bdfaf94aa6ee34798d74fb29dcaf012726fab7fb`
- `fundOnFirstSend` polls USDC balance up to 60s to close the faucet-lag race (see Sharp edges).

## Architecture & file map

```
a0x-private-pay/                                     (pnpm workspace)
├── apps/demo/                                       (Next.js 14, deployed)
│   ├── app/page.tsx                                 (landing — "Get a wallet"; H1 is large text-7xl)
│   ├── app/start/page.tsx                           (server component: mint prompt or dashboard)
│   ├── app/api/start/route.ts                       (POST: mint smart account, set kp cookie, 303)
│   ├── app/api/send/route.ts                        (POST: fund-on-first-send, sendUserOperation; returns userOpHash)
│   ├── app/api/send/[hash]/route.ts                 (GET: poll user op status via getUserOperation)
│   ├── app/api/faucet/route.ts                      (POST: manual testnet USDC faucet)
│   ├── app/api/balance/route.ts                     (GET: USDC + ETH balance)
│   ├── app/api/forget/route.ts                      (POST: clear kp cookie, 303 to /)
│   ├── components/wallet-card.tsx                   (client: badge, countdown, balance, faucet)
│   ├── components/start-dashboard.tsx               (client: widget + forget form)
│   ├── components/copy-button.tsx                   (client: clipboard)
│   ├── lib/kp.ts                                    (HMAC cookie: {wallet, name, iat})
│   ├── .env.local                                   (CDP creds + KP_SECRET — gitignored)
│   └── .env.example                                 (committed template)
│
├── packages/core/                                   (@bvdaniel/private-pay-core — Node only, v0.3.0 on npm)
│   ├── src/index.ts                                 (ConfidentialPay: smart accounts, sendUserOperation, gasless)
│   └── src/abis.ts                                  (Uniswap V3 SwapRouter02 + WETH constants)
│
└── packages/react/                                  (@bvdaniel/private-pay — v0.3.0 on npm)
    ├── src/index.tsx                                (ConfidentialUSDC widget; userOpHash status polling)
    ├── src/server.ts                                (createConfidentialPayHandler; returns userOpHash)
    └── src/ConfidentialUSDC.css                     (CSS shipped via dist/)
```

## Environment variables (all required on Vercel, project `a0x-confidential-pay-demo`)

```
CDP_API_KEY_ID=
CDP_API_KEY_SECRET=
CDP_WALLET_SECRET=
CDP_NETWORK=base-sepolia
KP_SECRET=                                     ← 32-byte hex; generate: openssl rand -hex 32
```

The CDP credential values live in `apps/demo/.env.local` (gitignored) and as Vercel project env vars. Don't leak them in chat or git. `KP_SECRET` was generated at setup; if regenerated, both local `.env.local` and Vercel must update.

## Pending (priority order)

### 1. Track B — CDP Payments business onboarding (gates real confidentiality)
Required for actual Base Ledgers confidential transfers (public ERC-20 today). Steps: `portal.cdp.coinbase.com` → `a0x-confidential-pay` project → "Go live with payments" 3-step flow (Business details → Compliance → Go live). Approval takes weeks. Once cleared, swap `sendUsdcPayment` in `packages/core/src/index.ts` → call Base Ledgers. The widget and demo need no changes.

### 2. ~~Publish to npm~~ → DONE (v0.3.0 on npm)
`@bvdaniel/private-pay@0.3.0` and `@bvdaniel/private-pay-core@0.3.0` are live (v0.2.0 + old `@bvdaniel/confidential-pay*` deprecated). v0.3.0 is the **smart-account refactor with self-funded gas** — sends batch approve+swap+transfer in one ERC-4337 user op, so **no ETH is required**. Scope is `@bvdaniel` (npm user `bvdaniel`). Republish: `pnpm publish --filter @bvdaniel/private-pay-core` then `pnpm publish --filter @bvdaniel/private-pay`. See Sharp edges.

## Sharp edges — what didn't work and why

### Gasless send (self-funded swap) — how and gotchas
- Each send is ONE user op with 3 batched calls: `approve(USDC, SwapRouter02, MAX)` → `exactInputSingle(0.005 USDC → WETH→ETH)` → `transfer(USDC, recipient)`. Wait, no external ETH is pre-required — the swapped ETH is consumed as the user op's gas (sender ends at 0 ETH, tx still succeeds).
- Uniswap V3 `SwapRouter02` is `0x2626664c2603336E57B271c5C0b26F421741e481` on both Base and Base Sepolia; WETH is `0x4200...0006`; fee tier 500 (0.05%).
- `sendUsdcPayment` returns `userOpHash`, NOT `transactionHash`. The UI must poll `GET /api/send/:hash` (`getUserOperation`, from SDK).
- **Don't use `waitForUserOperation` with `timeoutSeconds: 0`** — it returns before the op settles and reports "pending" forever. Use `getUserOperation` real-poll instead (fixed in v0.3.0).
- Gas overhead: reject/approve+swap add ~120k gas vs a plain transfer, but on testnet it's free and on mainnet ~$0.001–0.005/tx at current rates.
- Each wallet = a CDP **smart account** (ERC-4337) + one server-managed owner EOA. Wallet identity cookie now carries `{wallet, name, iat}`; the owner is re-fetched via `getAccount({ name: "${name}-owner" })` so the send route can re-resolve `getOrCreateSmartAccount({ name, owner })`.

### Vercel monorepo deploy settings (cost many cycles — don't reopen)
- `rootDirectory: apps/demo` and `framework: nextjs` set on the **project** (not in a `vercel.json`).
- `installCommand: pnpm install`; `buildCommand` empty (Next.js preset handles it); `outputDirectory` empty.
- The `dist/` of workspace packages **must be committed** — Vercel does not pre-build monorepo deps. `.gitignore` whitelists `!packages/core/dist/` and `!packages/react/dist/`.
- Setting a custom `buildCommand` together with `framework: nextjs` produced empty 30ms builds. Avoid.

### CDP smart-account balance lag
- After the USDC faucet, a brand-new wallet's balance can read 0 for ~5–10s even though the faucet tx is mined. `fundOnFirstSend` now polls every 5s for up to 60s after faucet. Don't regress this.

### Wallet secret format
- CDP wallet secret is a base64 DER ECDSA key (~184 chars), **not** the same as the API key secret (~86 chars). The SDK requires all three: `apiKeyId` (~36), `apiKeySecret` (86), `walletSecret` (184). Regenerating a wallet secret invalidates the old one.

### Faucet rate limits
- USDC faucet on Base Sepolia is rate-limited per hour per project; ETH faucet credits a small amount. Widget auto-funds only when low. Once exhausted, sends return "Insufficient balance." Local tests and the demo share the same project rate limit — resets hourly.

### Deployment protection
- Vercel personal-team default is `all_except_custom_domains`, which 302s `*.vercel.app` to login. The user turned this OFF on this project's Settings → Deployment Protection. If you create a new project, do the same.

### npm publish gotchas (learned the hard way)
- **2FA blocks publish**: `npm login` credentials don't satisfy 2FA-only publish. Need a granular access token (Settings → Tokens) with **Read and write** on the scope + **"Bypass 2FA"** box checked, used via `NODE_AUTH_TOKEN`. The default `~/.npmrc` from `npm login` overrides it — run publish with a throwaway `HOME` containing only the token, e.g. `HOME=/tmp/a0x-npm-home`.
- **`workspace:^` is rewritten to the real version at publish time** by pnpm — nobody edits package.json for that.
- **Peer deps must have a real published range**: core's original peer `@coinbase/cdp-sdk@^0.9.0` doesn't exist (only 1.x). It's a runtime import (`CdpClient`), so it became a regular `dependency: ^1.55.0`.
- **`@a0x` npm scope isn't owned by `bvdaniel`** — free npm accounts can't claim it. Publishes go under `@bvdaniel/*`. If a paid `@a0x` org is ever created, the packages can be renamed and republished.
- The demo's UI copy uses "// @a0x/private-pay" as product branding, while the published npm packages are under `@bvdaniel/*`. That's intentional — "a0x" is the brand, "bvdaniel" is the npm publisher.

## Anti-patterns to avoid

- Email-based magic links — rejected for privacy.
- Deploying to `a0x.co` apex — on a separate Vercel account we don't own.
- Adding turbo — pnpm workspaces + committed dist suffices; turbo adds its own caching heuristics.
- Any analytics/tracker — privacy posture forbids.

## Canonical test path (how to verify a change worked)

```bash
# local — start the demo
cd apps/demo && pnpm start -p 3300

# 1. mint
curl -s -i -X POST http://localhost:3300/api/start -o /tmp/m.txt
COOKIE=$(grep -i 'set-cookie:' /tmp/m.txt | sed 's/set-cookie: //I' | cut -d';' -f1)

# 2. /start renders dashboard with this cookie
curl -s -H "Cookie: $COOKIE" http://localhost:3300/start | grep "Send privately"

# 3. send 0.05 USDC — faucet may rate-limit; if so, wait for hourly reset
curl -s -H "Cookie: $COOKIE" -X POST http://localhost:3300/api/send \
  -H "Content-Type: application/json" \
  -d '{"recipient":"0x95F09B69C3E36B9c167304E0C174e0f48e62BD50","amount":"0.05"}'
# → {"ok":true,"userOpHash":"0x…","network":"base-sepolia","sender":"0x…"}
USEROP=$(curl -s -H "Cookie: $COOKIE" -X POST http://localhost:3300/api/send \
  -H "Content-Type: application/json" \
  -d '{"recipient":"0x95F09B69C3E36B9c167304E0C174e0f48e62BD50","amount":"0.05"}' \
  | grep -o '"userOpHash":"0x[a-fA-F0-9]*"')

# 4. poll status until complete
while true; do
  R=$(curl -s -H "Cookie: $COOKIE" "http://localhost:3300/api/send/$(echo $USEROP | sed 's/.*:"\(0x[a-fA-F0-9]*\)".*/\1/')")
  echo "$R"
  echo "$R" | grep -q '"complete"' && break
  sleep 4
done
# → {"status":"complete","transactionHash":"0x…"}
```

## Working preferences (match these)

- Todo discipline: exactly one `in_progress` at a time; commit each logical unit.
- No editorial summaries after commits.
- Plan mode is a hard wall: when on, never edit. Verify with a question if uncertainty is real.
- The user is fluent in Spanish / English / Spanglish — match their language as written, default English unless they switch.
- Local dev ports below 4000.
