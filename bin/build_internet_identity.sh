#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Build internet identity canister"

DESTINATION="./backend/dev/internet_identity"
mkdir -p $DESTINATION

WASM="$DESTINATION/internet_identity.wasm"
if ! test -f "$WASM"; then
  echo -e "Downloading internet identity wasm ..."
  curl -sSL https://github.com/dfinity/internet-identity/releases/download/release-2022-11-15/internet_identity_dev.wasm -o $WASM
fi

echo -e "Internet identity built!"
