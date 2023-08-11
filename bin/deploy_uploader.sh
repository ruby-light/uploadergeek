#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

if [ $# -eq 0 ]
  then
    me=$(basename "$0")
    usage "Deploy uploader canisters to dfx network." "$me <local | ic | ic_test> <IDENTITY>"
    exit 1
fi


NETWORK_ALIAS=$1
IDENTITY=$2

./bin/generate_uploader_candid.sh

header "Create uploader canister on '${NETWORK_ALIAS}' using identity '${IDENTITY}'"

IDENTITY_PRINCIPAL="$(dfx --identity "$IDENTITY" identity get-principal)"

dfx --identity "$IDENTITY" canister --network "${NETWORK_ALIAS}" create uploader
dfx --identity "$IDENTITY" canister --network "${NETWORK_ALIAS}" --wallet \
  "$(dfx --identity "$IDENTITY" identity --network "${NETWORK_ALIAS}" get-wallet)" \
  update-settings --add-controller "$IDENTITY_PRINCIPAL" uploader

header "Deploy uploader canister on '${NETWORK_ALIAS}'"

dfx --identity "$IDENTITY" deploy --network "${NETWORK_ALIAS}" uploader
