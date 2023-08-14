#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

NETWORK_ALIAS=local
IDENTITY=default

header "Create governance proposal to add UI 10000 user in network '${NETWORK_ALIAS}' using identity '${IDENTITY}'"

IDENTITY_PRINCIPAL="$(dfx --identity "$IDENTITY" identity get-principal)"

PERMISSIONS_ALL="vec{record{variant{UpdateGovernance};vec{variant{Add};variant{Vote};variant{Perform}}};record{variant{CallCanister};vec{variant{Add};variant{Vote};variant{Perform}}};record{variant{UpgradeCanister};vec{variant{Add};variant{Vote};variant{Perform}}};}"
LOCAL_II_10000_PRINCIPAL="eszuk-g3ton-3emrz-2uq23-oub4m-u2fhr-gd3vt-xkwf3-ldco5-vbhdd-iqe"

PARTICIPANT_LOCAL_II_10000="record{principal \"${LOCAL_II_10000_PRINCIPAL}\"; record{name=\"local_II_10000\";proposal_permissions=${PERMISSIONS_ALL}}; }"
PARTICIPANTS="vec{${PARTICIPANT_LOCAL_II_10000}}"

VOTING_CONFIGURATION="vec {record{variant{UpdateGovernance};record{stop_vote_count=1;positive_vote_count=1}}}"

NEW_GOVERNANCE="record{participants=${PARTICIPANTS}; voting_configuration=${VOTING_CONFIGURATION}}"

#1. Create proposal
dfx canister call governance add_new_proposal "(record{proposal_detail=variant {UpdateGovernance = record{new_governance=${NEW_GOVERNANCE}}}})"
#2. Vote proposal
dfx canister call governance vote_for_proposal "(record{vote=true;proposal_id=1})"
#3. Perform proposal
dfx canister call governance perform_proposal "(record{proposal_id=1})"