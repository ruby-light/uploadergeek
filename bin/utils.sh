#!/bin/bash
set -euo pipefail

span() {
  local message="$1"
  local color="$2"

  if [ -t 1 ]; then
    color_cmd=$(tput setaf "${color}")
    reset=$(tput sgr0)
    printf "%s%s%s" "${color_cmd}" "${message}" "${reset}"
  else
    printf "%s" "${message}"
  fi
}

header() {
  local message="$1"

  printf "\n"
  span "${message}" 9
  printf "\n\n"
}

usage() {
  local task="$1"
  local usage="$2"

  span "TASK:" 11
  printf "\n  %s\n\n" "${task}"
  span "USAGE:" 11
  printf "\n  "
  span "${usage}" 2
  printf "\n"
}

rainbow() {
  local message="$1"
  local reset='\e[0m'
  for ((colour = 1; colour <= 99; colour++)); do
    colour_code="\\e[0;${colour}m"
    span "asdfasdfasdf" "${colour}"
    printf "${colour} - ${colour_code}${message}${reset}\n"
  done
}
