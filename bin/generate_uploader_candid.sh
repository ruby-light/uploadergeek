#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Generate uploader candid"

cargo run --manifest-path backend/generate_candid/uploader/Cargo.toml > backend/canisters/uploader/api/can.did

