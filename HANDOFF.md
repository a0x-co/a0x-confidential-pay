# Handoff — a0x-confidential-pay

> State for the agent picking this up. Read the first 5 lines for "where we are"; the full file for everything else.

## Where we are (read this first)

We shipped a working end-to-end demo of `@a0x/confidential-pay` — a drop-in React component for confidential USDC payments on Base. Each visitor lands on the page, claims a 30-minute ephemeral wallet (no email, no account, no DB), and sends USDC from that wallet to any address on Base Sepolia.

- **Live:** https://a0x-confidential-pay-demo-2w42vltmu-bvdaniels-projects.vercel.app
- **Repo:** github.com/a0x-co/a0x-confidential-pay
- **Vercel project:** `a0x-confidential-pay-demo` (id `prj_ssLOsHiSIp7sjPqYOGLlrv2XVWWr`)
- **What works end-to-end:** confirmed live, tx `0x0feb9e27eeb7a113f7a1eb00bdfaf94aa6ee34798d74fb29dcaf012726fab7fb` on Base Sepolia
- **What's left:** swap the public ERC-20 transfer for a confidential one via Base Ledgers (Track B); publish to npm

The flow is verified: visitor mints → dashboard shows a fresh wallet → enter recipient + amount → pay → tx settles on Base Sepolia. Server is stateless; the 30-min identity is an HMAC-signed cookie.

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
a0x-confidential-pay/                                (pnpm workspace)
├── apps/demo/                                       (Next.js 14, deployed)
│   ├── app/page.tsx                                 (landing — "Get a wallet")
│   ├── app/start/page.tsx                           (server component: mint prompt or dashboard)
│   ├── app/api/start/route.ts                       (POST: mint wallet, set kp cookie, 303)
│   ├── app/api/send/route.ts                        (POST: verify cookie, fund-on-first-send, send)
│   ├── app/api/forget/route.ts                      (POST: clear kp cookie, 303 to /)
│   ├── components/start-dashboard.tsx               (client: widget + forget form)
│   ├── lib/kp.ts                                    (HMAC sign/verify for the kp cookie)
│   ├── .env.local                                   (CDP creds + KP_SECRET — gitignored)
│   └── .env.example                                 (committed template)
│
├── packages/core/                                   (@a0x/confidential-pay-core — Node only)
│   └── src/index.ts                                 (ConfidentialPay class; fundOnFirstSend polls USDC)
│
└── packages/react/                                  (@a0x/confidential-pay — internal package, not yet published)
    ├── src/index.tsx                                (ConfidentialUSDC widget; editable recipient when prop is empty)
    ├── src/server.ts                                (createConfidentialPayHandler)
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

### 2. Publish `@a0x/confidential-pay` to npm
Repo is ready. `npm login`, then from workspace root: `pnpm publish --filter @a0x/confidential-pay`. Package files: `packages/react/package.json` exports `.`, `./server`, `./ConfidentialUSDC.css`. Consider publishing core first as a peer.

## Sharp edges — what didn't work and why

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

# 3. send 0.05 USDC
curl -s -H "Cookie: $COOKIE" -X POST http://localhost:3300/api/send \
  -H "Content-Type: application/json" \
  -d '{"recipient":"0x95F09B69C3E36B9c167304E0C174e0f48e62BD50","amount":"0.05"}'
# → {"ok":true,"transactionHash":"0x…","network":"base-sepolia","sender":"0x…"}

# 4. confirm onchain (core package has the receipt helper)
cd ../packages/core && node --env-file=.env -e "
import('./dist/index.js').then(async ({ConfidentialPay}) => {
  const pay = new ConfidentialPay();
  console.log((await pay.waitForReceipt('0x…')).status);
})" 2>&1 | grep -vE 'injected env|tip:'
```

## Working preferences (match these)

- Todo discipline: exactly one `in_progress` at a time; commit each logical unit.
- No editorial summaries after commits.
- Plan mode is a hard wall: when on, never edit. Verify with a question if uncertainty is real.
- The user is fluent in Spanish / English / Spanglish — match their language as written, default English unless they switch.
- Local dev ports below 4000.
