#!/bin/bash
set -euo pipefail

for canister_path in ./backend/canisters/*/
do
  canister_path=${canister_path%*/}
  candid=${canister_path}/api/can.did
  package=`echo ${canister_path} | sed s/[.][/]backend[/]canisters[/]//`_canister

  echo Generate candid ${candid}
  echo Generate candid ${package}
  cargo run -p ${package} > ${candid}
done
