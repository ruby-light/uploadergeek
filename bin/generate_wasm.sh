#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Building wasm"

PACKAGE=$1

# NOTE: On macOS a specific version of llvm-ar and clang need to be set here.
# Otherwise the wasm compilation of rust-secp256k1 will fail.
# https://github.com/dfinity/bitcoin-developer-preview/blob/master/examples/rust/build.sh

. ./bin/os_deps.sh
cargo build --target wasm32-unknown-unknown --release --package "$PACKAGE" ${LOCKED:-}

RELEASE_DIR=target/wasm32-unknown-unknown/release
RELEASE_FILE_PREFIX="$RELEASE_DIR/$PACKAGE"

header "Optimising wasm"

# please install ic-wasm using `cargo install ic-wasm`
# ic-wasm "$RELEASE_FILE_PREFIX".wasm -o "${RELEASE_FILE_PREFIX}"-opt.wasm shrink --optimize O1
ic-wasm "$RELEASE_FILE_PREFIX".wasm -o "${RELEASE_FILE_PREFIX}"-shrink.wasm shrink
ic-wasm "$RELEASE_FILE_PREFIX"-shrink.wasm -o "${RELEASE_FILE_PREFIX}"-opt.wasm optimize O1
