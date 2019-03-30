#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# get_script_dir () {
#      SOURCE="${BASH_SOURCE[0]}"
#      # While $SOURCE is a symlink, resolve it
#      while [ -h "$SOURCE" ]; do
#           DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
#           SOURCE="$( readlink "$SOURCE" )"
#           # If $SOURCE was a relative symlink (so no "/" as prefix, need to resolve it relative to the symlink base directory
#           [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
#      done
#      DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
#      echo "$DIR/node_modules/.bin"
# }

READY_URL=http://localhost:3000/\#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070

if [ "$SOLIDITY_COVERAGE" = true ]; then
	testrpc_port=8555
else
	testrpc_port=8545
fi

testrpc_running() {
	nc -z localhost "$testrpc_port"
}

apps_cleanup() {
	kill -9 "$(lsof -i:1111 -sTCP:LISTEN -t)" # kill parcel adress book dev server
	kill -9 "$(lsof -i:2222 -sTCP:LISTEN -t)" # kill parcel allocations dev server
	kill -9 "$(lsof -i:3333 -sTCP:LISTEN -t)" # kill parcel projects dev server
	kill -9 "$(lsof -i:4444 -sTCP:LISTEN -t)" # kill parcel range voting dev server
	kill -9 "$(lsof -i:5555 -sTCP:LISTEN -t)" # kill parcel rewards dev server
}

services_cleanup() {
	kill -9 "$(lsof -i:3000 -sTCP:LISTEN -t)" # kill parcel dev server
	kill -9 "$(lsof -i:8080 -sTCP:LISTEN -t)" # kill IPFS daemon
}

start_testrpc() {
	if [ "$SOLIDITY_COVERAGE" = true ]; then
		testrpc-sc -i 16 --gasLimit 0xfffffffffff --port "$testrpc_port" >/dev/null &
	elif [ "$TRUFFLE_TEST" = true ]; then
		ganache-cli -i 15 --gasLimit 50000000 --port "$testrpc_port" >/dev/null &
	elif [ "$START_KIT" = true ]; then
		aragon devchain --port "$testrpc_port" &
	elif [ "$RESTART_KIT" = true ] || [ "$CYPRESS" = true ]; then
		rm -rf ~/.ipfs
		aragon devchain --reset --port "$testrpc_port" &
	elif [ "$DEV" = true ] || [ "$CYPRESS_DEV" = true ]; then
		if [ "$RESET" = true ]; then
			aragon devchain --reset --port "$testrpc_port" &
		else
			aragon devchain --port "$testrpc_port" &
		fi
		lerna run dev --parallel --scope=@tps/apps-* &
	fi

	testrpc_pid=$!
}

if testrpc_running; then
	echo "Killing testrpc instance at port $testrpc_port"
	kill -9 "$(lsof -i:"$testrpc_port" -sTCP:LISTEN -t)"
fi

echo "Starting our own testrpc instance at port $testrpc_port"
start_testrpc
sleep 5

# Exit error mode so the testrpc instance always gets killed
set +e
result=0
if [ "$SOLIDITY_COVERAGE" = true ]; then
	solidity-coverage "$@"
	result=$?
elif [ "$TRUFFLE_TEST" = true ]; then
	truffle test --network rpc "$@" | grep -v 'Compiling'
	result=$?
elif [ "$START_KIT" = true ] || [ "$RESTART_KIT" = true ]; then
	npm run publish:apps && npm run start:kit "$@"
	result=$?
elif [ "$DEV" = true ]; then
	npm run publish:http && npm run start:kit "$@"
	result=$?
elif [ "$CYPRESS_DEV" = true ]; then
	npm run publish:http && npm run start:kit &
	wait-on "$READY_URL" && npm run cypress:open "$@"
	result=$?
	services_cleanup
	apps_cleanup
elif [ "$CYPRESS" = true ]; then
	npm run publish:apps && npm run start:kit &> /dev/null &
	npm run cypress:run "$@"
	services_cleanup
	result=$?
fi

kill -9 $testrpc_pid

if [ "$result" -eq 130 ]; then
	echo "Script terminated by [control+c] . Goodbye! 👋"
	exit 0
else
	exit $result
fi
