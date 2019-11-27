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
  PORT=${PORT-8555}
  BALANCE=${BALANCE-100000}
  GAS_LIMIT=${GAS_LIMIT-0xfffffffffff}
  NETWORK_ID=${NETWORK_ID-16}
}

setup_testing_variables() {
  PORT=${PORT-8545}
  BALANCE=${BALANCE-100000}
  GAS_LIMIT=${GAS_LIMIT-8000000}
  NETWORK_ID=${NETWORK_ID-15}
  ACCOUNTS=${ACCOUNTS-200}
}

start_ganache() {
  echo "Starting ganache-cli..."
  ganache-cli -i ${NETWORK_ID} -l ${GAS_LIMIT} -a ${ACCOUNTS} -e ${BALANCE} -p ${PORT} > /dev/null &
  pid=$!
  sleep 3
  echo "Running ganache-cli with pid ${pid} in port ${PORT}, gas limit set to: ${GAS_LIMIT}"
}

start_testrpc() {
  echo "Starting testrpc-sc..."
  testrpc-sc -i ${NETWORK_ID} -l ${GAS_LIMIT} -e ${BALANCE} -p ${PORT} > /dev/null &
  rpc_pid=$!
  sleep 3
  echo "Running testrpc-sc with pid ${rpc_pid} in port ${PORT}"
}

deploy_standard_bounties() {
  echo "Deploying bounties contract..."
  BOUNTIES=$(npm run deploy:bounties | tail -n 1)
}

deploy_standard_bounties_coverage() {
  echo "Deploying bounties contract..."
  BOUNTIES=$(npm run deploy:bounties:coverage | tail -n 1)
}

deploy_template_rpc() {
  echo "Deploying template..."
  npm run deploy:rpc -- --s ${BOUNTIES}
}

deploy_template_coverage() {
  echo "Deploying template..."
  npm run deploy:coverage -- --s ${BOUNTIES}
}

clean_deploy() {
  rm -f arapp_local.json
}

run_tests() {
  echo "Running tests $@..."
  truffle test --network rpc $@
}

measure_coverage() {
  echo "Measuring coverage..."
  solidity-coverage
}

if [ "$SOLIDITY_COVERAGE" = true ]; then
  setup_coverage_variables
  start_testrpc
  clean_deploy
  deploy_standard_bounties_coverage
  deploy_template_coverage
  measure_coverage
else
  setup_testing_variables
  start_ganache
  clean_deploy
  deploy_standard_bounties
  deploy_template_rpc
  run_tests $@
fi
