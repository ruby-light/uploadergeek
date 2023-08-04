#!/bin/bash
set -euo pipefail

IDENTITY=$(dfx identity whoami)

./bin/deploy_governance.sh local "$IDENTITY"

