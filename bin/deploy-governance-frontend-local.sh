#!/bin/bash
set -euo pipefail

IDENTITY=$(dfx identity whoami)
ASSET_CANISTER_NAME=governance_frontend_debug
ADDITIONAL_ENV_VARIABLES="TEST_UI_SERVER=true"

dfx deploy internet_identity

./bin/deploy-governance-frontend.sh local "$IDENTITY" "$ASSET_CANISTER_NAME" "$ADDITIONAL_ENV_VARIABLES"