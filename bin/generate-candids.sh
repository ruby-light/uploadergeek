#!/bin/bash
set -euo pipefail

cargo run --manifest-path backend/generate_candid/Cargo.toml > backend/uploader/api/can.did
