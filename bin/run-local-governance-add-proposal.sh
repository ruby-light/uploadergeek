#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

NETWORK_ALIAS=local
IDENTITY=default

PRINCIPAL="ziqcz-ouk4n-ez2ek-bmwra-k2w7l-iimo6-2scbu-6nbip-hk6na-fnh43-zqe"

header "Create governance proposal to add '${PRINCIPAL}' in network '${NETWORK_ALIAS}' using identity '${IDENTITY}'"

echo "Proceed? (y/n)"
read answer
if [ "$answer" != "y" ]; then
    echo "Cancelled..."
    exit 1
fi

IDENTITY_PRINCIPAL="$(dfx --identity "$IDENTITY" identity get-principal)"

PERMISSIONS_ALL="vec{record{variant{UpdateGovernance};vec{variant{Add};variant{Vote};variant{Perform}}};record{variant{CallCanister};vec{variant{Add};variant{Vote};variant{Perform}}};record{variant{UpgradeCanister};vec{variant{Add};variant{Vote};variant{Perform}}};}"

PARTICIPANT="record{principal \"${PRINCIPAL}\"; record{name=\"participant\";proposal_permissions=${PERMISSIONS_ALL}}; }"
PARTICIPANTS="vec{${PARTICIPANT}}"

VOTING_CONFIGURATION="vec {record{variant{UpdateGovernance};record{stop_vote_count=1;positive_vote_count=1}};record{variant{CallCanister};record{stop_vote_count=1;positive_vote_count=1}};record{variant{UpgradeCanister};record{stop_vote_count=1;positive_vote_count=1}}}"

NEW_GOVERNANCE="record{participants=${PARTICIPANTS}; voting_configuration=${VOTING_CONFIGURATION}}"

#1. Create proposal
#dfx canister --identity "$IDENTITY" --network "${NETWORK_ALIAS}" call governance add_new_proposal "(record{proposal_detail=variant {UpdateGovernance = record{new_governance=${NEW_GOVERNANCE}}}})"
#2. Vote proposal
#dfx canister --identity "$IDENTITY" --network "${NETWORK_ALIAS}" call governance vote_for_proposal "(record{vote=true;proposal_id=1})"
#3. Perform proposal
#dfx canister --identity "$IDENTITY" --network "${NETWORK_ALIAS}" call governance perform_proposal "(record{proposal_id=1})"