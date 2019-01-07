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
	elif [ "$RESTART_KIT" = true ]; then
		rm -rf ~/.ipfs
		aragon devchain --reset --port "$testrpc_port" &
	elif [ "$DEV" = true ]; then
		aragon devchain --reset --port "$testrpc_port" &
		lerna run dev --parallel --scope=@tps/apps-* &
	fi

	testrpc_pid=$!
}

if testrpc_running; then
	echo "Killing testrpc instance at port $testrpc_port"
	#  TODO: Fails when multiple processes are open (should check for each)
	kill -9 "$(lsof -i:"$testrpc_port" -t)"
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
	npm run publish:apps && npm run start:kit
	result=$?
elif [ "$DEV" = true ]; then
	npm run publish:http && npm run start:kit
	result=$?
fi

kill -9 $testrpc_pid

exit $result
