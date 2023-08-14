#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

if [ $# -eq 0 ]
  then
    me=$(basename "$0")
    usage "Deploy governance frontend canister to dfx network." "$me <local | ic | ic_test> <IDENTITY> <ASSET_CANISTER_NAME> <ADDITIONAL_ENV_VARIABLES>"
    exit 1
fi

NETWORK_ALIAS=$1
IDENTITY=$2
ASSET_CANISTER_NAME=$3
ADDITIONAL_ENV_VARIABLES=$4

header "Create IDgeek Governance frontend canister '${ASSET_CANISTER_NAME}' on '${NETWORK_ALIAS}' using identity '${IDENTITY}' with additional env variables '${ADDITIONAL_ENV_VARIABLES}'"

echo "Proceed? (y/n)"
read answer
if [ "$answer" != "y" ]; then
    echo "Cancelled..."
    exit 1
fi

dfx canister --identity "$IDENTITY" --network "${NETWORK_ALIAS}" create "${ASSET_CANISTER_NAME}"

ASSET_CANISTER_PRINCIPAL="$(dfx canister --network "${NETWORK_ALIAS}" id "${ASSET_CANISTER_NAME}")"
echo -e "Asset canister canister principal: '${ASSET_CANISTER_PRINCIPAL}'"

IDENTITY_PRINCIPAL="$(dfx --identity "$IDENTITY" identity get-principal)"
echo -e "Identity '${IDENTITY}' principal: ${IDENTITY_PRINCIPAL}"

eval $ADDITIONAL_ENV_VARIABLES dfx deploy --identity "$IDENTITY" --network "${NETWORK_ALIAS}" "${ASSET_CANISTER_NAME}"