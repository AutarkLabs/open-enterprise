#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the RPC instance that we started (if we started one and if it's still running).
  if [ -n "$pid" ] && ps -p $pid > /dev/null; then
    kill -9 $pid
  fi

  # Remove local deploy file in case it was created
  clean_deploy
}

setup_coverage_variables() {
  ACCOUNTS=${ACCOUNTS-200}  
  BALANCE=${BALANCE-100000}
  COMMAND=${COMMAND-testrpc-sc}
  ENVIRONMENT=${ENVIRONMENT-coverage}
  GAS_LIMIT=${GAS_LIMIT-0xfffffffffff}
  MAIN_TASK=${MAIN_TASK-run_coverage}
  NETWORK_ID=${NETWORK_ID-16}
  PORT=${PORT-8555}
}

setup_testing_variables() {
  ACCOUNTS=${ACCOUNTS-200}
  BALANCE=${BALANCE-100000}
  COMMAND=${COMMAND-ganache-cli}
  ENVIRONMENT=${ENVIRONMENT-rpc}
  GAS_LIMIT=${GAS_LIMIT-8000000}
  MAIN_TASK=${MAIN_TASK-run_tests}
  NETWORK_ID=${NETWORK_ID-15}
  PORT=${PORT-8545}
}

start_chain() {
  echo "Starting ${COMMAND}..."
  ${COMMAND} -i ${NETWORK_ID} -l ${GAS_LIMIT} -a ${ACCOUNTS} -e ${BALANCE} -p ${PORT} > /dev/null &
  pid=$!
  sleep 3 # give time to init chain
  echo "Running ganache-cli with pid ${pid} in port ${PORT}, gas limit set to: ${GAS_LIMIT}"
}

clean_deploy() {
  rm -f arapp_local.json
}

run_tests() {
  echo "Running tests $@..."
  truffle test --network rpc $@
}

run_coverage() {
  echo "Measuring coverage $@..."
  # TODO: rimraf or crossenv
  # It is needed to remove this folder to prevent wrong instrumentation
  # I didn't find a way to tell solidity-coverage to ignore it
  rm -rf flattened_contracts
  solidity-coverage $@
}

[[ "$SOLIDITY_COVERAGE" = true ]] && setup_coverage_variables || setup_testing_variables
start_chain
${MAIN_TASK} $@