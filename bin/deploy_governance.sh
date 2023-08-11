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

header "Create governance canister on '${NETWORK_ALIAS}' using identity '${IDENTITY}'"

IDENTITY_PRINCIPAL="$(dfx --identity "$IDENTITY" identity get-principal)"

dfx --identity "$IDENTITY" canister --network "${NETWORK_ALIAS}" create governance
dfx --identity "$IDENTITY" canister --network "${NETWORK_ALIAS}" --wallet \
  "$(dfx --identity "$IDENTITY" identity --network "${NETWORK_ALIAS}" get-wallet)" \
  update-settings --add-controller "$IDENTITY_PRINCIPAL" governance

header "Deploy governance canister on '${NETWORK_ALIAS}'"

PARTICIPANT_1="record{principal \"${IDENTITY_PRINCIPAL}\"; record{name=\"identity\";proposal_permissions=vec{record{variant{UpdateGovernance};vec{variant{Add};variant{Vote};variant{Perform}}}}}}"
PARTICIPANT_2="record{principal \"4yl5c-iixs5-wuyhi-bals2-ddskn-tlm3z-vdsy7-rcmsd-yfujt-f3i2g-7ae\"; record{name=\"local_II_10000\";proposal_permissions=vec{record{variant{UpdateGovernance};vec{variant{Add};variant{Vote};variant{Perform}}};record{variant{CallCanister};vec{variant{Add};variant{Vote};variant{Perform}}};record{variant{UpgradeCanister};vec{variant{Add};variant{Vote};variant{Perform}}};}}}"
PARTICIPANT_3="record{principal \"bwqqq-n4zxd-xvzc2-pv4e3-hz5kq-zy2a3-yd3w6-k6blz-d5u7p-y5eto-qae\"; record{name=\"local_II_10001\";proposal_permissions=vec{record{variant{UpdateGovernance};vec{variant{Add};variant{Vote};variant{Perform}}}}}}"
PARTICIPANTS="vec{${PARTICIPANT_2};${PARTICIPANT_3}}"
VOTING_CONFIGURATION="vec {record{variant{UpdateGovernance};record{stop_vote_count=1;positive_vote_count=1}};record{variant{CallCanister};record{stop_vote_count=1;positive_vote_count=1}};record{variant{UpgradeCanister};record{stop_vote_count=1;positive_vote_count=1}}}"
GEEK_USER_PRINCIPALS="vec {principal \"${IDENTITY_PRINCIPAL}\"}"

dfx --identity "$IDENTITY" deploy --network "${NETWORK_ALIAS}" --argument \
"(record { governance = record{participants=${PARTICIPANTS}; voting_configuration=${VOTING_CONFIGURATION}}; geek_user_principals=${GEEK_USER_PRINCIPALS}})" governance


#dfx canister call governance add_new_proposal '(record{proposal_detail=variant {UpdateGovernance = record{new_governance=record{participants=vec{record{principal "lpag6-ktxsv-3oewm-s4gok-fzo2e-qcn2v-kzdpi-eozwc-ddv2o-rbbx4-wae"; record{name="slaig";proposal_permissions=vec{record{variant{UpdateGovernance}; vec{variant{Add};variant{Vote};variant{Perform}} }}}}}; voting_configuration=vec {record{variant{UpdateGovernance};record{stop_vote_count=1;positive_vote_count=1}}}}}}})'

