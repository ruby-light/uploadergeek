#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Generate governance candid"

cargo run --manifest-path backend/generate_candid/governance/Cargo.toml > backend/canisters/governance/api/can.did
