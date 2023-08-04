#!/bin/bash
set -euo pipefail

NETWORK_ALIAS=$1

NETWORK_JSON=$(dfx info networks-json-path)

if [ "$NETWORK_ALIAS" = "local" ]; then
   echo "http://$(jq -r .local.bind "${NETWORK_JSON}")/"
else
  jq -r ".$NETWORK_ALIAS.providers[0]" "${NETWORK_JSON}"
fi
