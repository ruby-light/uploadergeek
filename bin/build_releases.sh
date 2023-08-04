#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Build releases"

cargo build --release



