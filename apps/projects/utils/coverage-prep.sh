#!/bin/bash
sleep 5
IFS=$'\n' 
cd ../../shared/integrations/StandardBounties
BOUNT_ADDR=($(./node_modules/.bin/truffle migrate --network coverage | grep "^0x[[:alnum:]]\{40\}"))
#./node_modules/.bin/truffle version
#./node_modules/.bin/truffle migrate --network coverage
cd ../../../apps/projects
unset IFS
echo "Bounties Addresses: ${BOUNT_ADDR[*]}"
#BOUNT_ADDR=${BOUNT_ADDR[*]} truffle test --network rpc
