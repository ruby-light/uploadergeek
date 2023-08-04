#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Cargo check"
cargo check

header "Cargo clippy"
cargo clippy

header "Cargo fmt"
cargo fmt

header "Cargo test"
cargo test --lib

./bin/generate_governance_candid.sh
./bin/generate_uploader_candid.sh



