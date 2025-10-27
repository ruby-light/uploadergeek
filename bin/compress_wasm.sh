#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

PACKAGE=$1

header "Compress wasm"

xz -fkz target/wasm32-unknown-unknown/release/"$PACKAGE"-opt.wasm
