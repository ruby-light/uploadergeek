#!/bin/bash
set -euo pipefail

IDENTITY=$(dfx identity whoami)

./bin/deploy_uploader.sh local "$IDENTITY"

