#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Generating uploader wasm"
./bin/generate_wasm.sh uploader_canister_impl
./bin/compress_wasm.sh uploader_canister_impl
./bin/generate_uploader_candid.sh
