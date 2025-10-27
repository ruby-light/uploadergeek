#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

BUILD_TARGET=$1

header "Preparing governance frontend release (build target: $BUILD_TARGET)"

npm ci
npm run $BUILD_TARGET

# export LOCKED=--locked

header "Generating governance wasm"
./bin/generate_wasm.sh governance_canister_impl
./bin/compress_wasm.sh governance_canister_impl
./bin/generate_governance_candid.sh
