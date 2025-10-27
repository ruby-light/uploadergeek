#!/bin/bash
if [[ "$OSTYPE" == darwin* ]]; then
  export AR="/usr/local/opt/llvm/bin/llvm-ar"
  export CC="/usr/local/opt/llvm/bin/clang"
fi
