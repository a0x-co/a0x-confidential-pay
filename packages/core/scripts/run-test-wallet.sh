#!/bin/bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd "$(dirname "$0")/.."
node --env-file=.env --experimental-strip-types scripts/test-wallet.ts 2>&1 | grep -vE "injected env|tip:|ExperimentalWarning|--import"
