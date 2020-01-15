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

if [ "$SOLIDITY_COVERAGE" = true ]; then
	testrpc_port=8555
else
	testrpc_port=8545
fi

testrpc_running() {
	nc -z localhost "$testrpc_port"
}

start_testrpc() {
	if [ "$SOLIDITY_COVERAGE" = true ]; then
		testrpc-sc -i 16 --gasLimit 0xfffffffffff --port "$testrpc_port" >/dev/null &
	elif [ "$TRUFFLE_TEST" = true ]; then
		ganache-cli -i 15 --gasLimit 50000000 --port "$testrpc_port" >/dev/null &
	elif [ "$START_KIT" = true ]; then
		aragon devchain --port "$testrpc_port" &
	elif [ "$RESTART_KIT" = true ] || [ "$CYPRESS" = true ]; then
		aragon devchain --reset --port "$testrpc_port" &
	elif [ "$DEV" = true ]; then
		aragon devchain --reset --port "$testrpc_port" &
		sleep 10 # wait for devchain to start TODO: modify cli to return rather than require interruption
		npm run frontend &
	elif [ "$NO_CLIENT" = true ]; then
		npm run frontend &
		aragon devchain --reset --port "$testrpc_port" &
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
	npm run publish:apps && npm run start:template
	result=$?
elif [ "$DEV" = true ]; then
	npm run publish:http && npm run start:dev-template
	result=$?
elif [ "$NO_CLIENT" = true ]; then
	npm run publish:http && npm run start:kit:no:client
	result=$?
elif [ "$CYPRESS" = true ]; then
	npm run frontend 2> /dev/null &
	app_pgid=$!
	aragon ipfs install
	aragon ipfs start &
	wait-on http://localhost:3333 # wait for bulkiest app service to load (Projects)
	npm run publish:http && npm run start:dev-template
	pushd . && cd .. 
	git clone https://github.com/aragon/aragon.git a-client
	cd a-client
	git checkout bdf5d44bf1b3da72130c086b7a802470533058a1 # latest client commit tested thoroughly with OE
	npm i
	npm run start:local 2> /dev/null & popd
	npm run cypress:run
	result=$?
	kill -9 "$(lsof -i:3000 -sTCP:LISTEN -t)" # kill parcel dev server
	kill -9 "$(lsof -i:8080 -sTCP:LISTEN -t)" # kill IPFS daemon
	kill -2 -- $app_pgid # kill app file services
	kill -9 "$(lsof -i:1111 -sTCP:LISTEN -t)" # kill app service file descriptor
	kill -9 "$(lsof -i:2222 -sTCP:LISTEN -t)" # kill app service file descriptor
	kill -9 "$(lsof -i:3333 -sTCP:LISTEN -t)" # kill app service file descriptor
	kill -9 "$(lsof -i:4444 -sTCP:LISTEN -t)" # kill app service file descriptor
	kill -9 "$(lsof -i:5555 -sTCP:LISTEN -t)" # kill app service file descriptor
	rm -rf ../a-client
fi

kill -9 $testrpc_pid

exit $result
