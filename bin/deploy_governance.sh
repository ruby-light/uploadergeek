#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

if [ $# -eq 0 ]
  then
    me=$(basename "$0")
    usage "Deploy governance canisters to dfx network." "$me <local | ic | ic_test> <IDENTITY>"
    exit 1
fi


NETWORK_ALIAS=$1
IDENTITY=$2

./bin/generate_governance_candid.sh

header "Create governance canister on '${NETWORK_ALIAS}'"

IDENTITY_PRINCIPAL="$(dfx --identity "$IDENTITY" identity get-principal)"

dfx --identity "$IDENTITY" canister --network "${NETWORK_ALIAS}" create governance
dfx --identity "$IDENTITY" canister --network "${NETWORK_ALIAS}" --wallet \
  "$(dfx --identity "$IDENTITY" identity --network "${NETWORK_ALIAS}" get-wallet)" \
  update-settings --add-controller "$IDENTITY_PRINCIPAL" governance

header "Deploy governance canister on '${NETWORK_ALIAS}'"

PARTICIPANTS="vec{record{principal \"${IDENTITY_PRINCIPAL}\"; record{name=\"identity\";proposal_permissions=vec{record{variant{UpdateGovernance};vec{variant{Add};variant{Vote};variant{Perform}}}}}}}"
VOTING_CONFIGURATION="vec {record{variant{UpdateGovernance};record{stop_vote_count=1;positive_vote_count=1}}}"
GEEK_USER_PRINCIPALS="vec {principal \"${IDENTITY_PRINCIPAL}\"}"

dfx --identity "$IDENTITY" deploy --network "${NETWORK_ALIAS}" --argument \
"(record { governance = record{participants=${PARTICIPANTS}; voting_configuration=${VOTING_CONFIGURATION}}; geek_user_principals=${GEEK_USER_PRINCIPALS}})" governance


#dfx canister call governance add_new_proposal '(record{proposal_detail=variant {UpdateGovernance = record{new_governance=record{participants=vec{record{principal "lpag6-ktxsv-3oewm-s4gok-fzo2e-qcn2v-kzdpi-eozwc-ddv2o-rbbx4-wae"; record{name="slaig";proposal_permissions=vec{record{variant{UpdateGovernance}; vec{variant{Add};variant{Vote};variant{Perform}} }}}}}; voting_configuration=vec {record{variant{UpdateGovernance};record{stop_vote_count=1;positive_vote_count=1}}}}}}})'
