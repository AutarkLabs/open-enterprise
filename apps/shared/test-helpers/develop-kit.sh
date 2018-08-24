#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

testrpc_port=8545

testrpc_running() {
    nc -z localhost "$testrpc_port"
}

start_testrpc() {
    if [ "$RESET" = true ]; then
        echo "RESET=true -> Will delete ~/.aragon folder ctrl+c to abort now" && sleep 2
        rm -rf ~/.aragon
        npx aragon devchain --reset > /dev/null &
    else
        npx aragon devchain --port "$testrpc_port" > /dev/null &
    fi
    
    testrpc_pid=$!
}

if testrpc_running; then
  echo "Killing testrpc instance at port $testrpc_port"
  kill -9 $(lsof -i:$testrpc_port -t)
fi

echo "Starting our own testrpc instance at port $testrpc_port"
start_testrpc
sleep 5

replace_manifest_path() {
    file=$PWD/manifest.json
    output=$PWD/dist/manifest.json
    sed "s/dist\\///g" $file > $output
}

export -f replace_manifest_path

copy_assets() {
   mkdir -p dist/images && cp images/icon.svg  dist/images/
}

export -f copy_assets

deploy_contract() {
    deployed_at=$(npx truffle compile && npx truffle migrate --reset | tail -4 | head -1 | awk '{ print $NF }')
    echo "Deployed at:" $deployed_at
    published=$(npm run publish:http -- --contract $deployed_at | tail -2)
    echo $published
    replace_manifest_path
    copy_assets
    sleep 2
}

export -f deploy_contract

multi_parcel_running() {
    nc -z localhost "1111"
}

if multi_parcel_running; then
    for i in `seq 1 4`;
    do
        parcel_port=$(printf %4s | tr " " $i)
        echo "Killing parcel instance at port"  $parcel_port
        kill -9 $(lsof -i:$parcel_port -t)
    done
fi

start_multi_parcel() {
   npx lerna run dev --log-level=silent --parallel "$@" &
   parallel_pid=$!
}

start_kit() {
    # Exit error mode so the testrpc and parallel parcel instances always gets killed
    set +e
    result=0
    npm run start:kit "$@"
    echo "Terminated, wait the cleaning up..."
    result=$?
    
    echo "Terminating testrpc..."
    kill -9 $testrpc_pid
    echo "Terminating parcel instances..."
    kill -9 $parallel_pid
    
    exit $result
}

echo "Compiling and getting deployed contract address"
npx lerna exec --scope=@tpt/apps-* --concurrency=1 --stream -- deploy_contract
npx lerna exec --scope=@tpt/apps-* -- apm versions
echo "Starting multi parcel instances in parallel execution"
start_multi_parcel
sleep 10

kit_running() {
    nc -z localhost "3000"
}

if kit_running; then
  echo "Killing kit instance at port 3000"
  kill -9 $(lsof -i:'3000' -t)
fi

start_kit







