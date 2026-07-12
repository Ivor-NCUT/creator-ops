#!/bin/sh
set -eu

: "${ALLOW_DEMO_RESET:?set ALLOW_DEMO_RESET=true to reset the fictional demo organization}"
[ "$ALLOW_DEMO_RESET" = "true" ] || { echo "ALLOW_DEMO_RESET must equal true" >&2; exit 1; }
[ "${NODE_ENV:-development}" != "production" ] || { echo "demo reset is disabled in production" >&2; exit 1; }

pnpm tsx scripts/reset-demo.ts
pnpm db:seed
