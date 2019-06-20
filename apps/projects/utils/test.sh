#!/bin/bash
sleep 5
IFS=$'\n' 
cd ../../shared/integrations/StandardBounties
BOUNT_ADDR=($(truffle migrate --network development | grep "^0x[[:alnum:]]\{40\}"))
#truffle migrate --network development
cd ../../../apps/projects
unset IFS
echo "Bounties Addresses: ${BOUNT_ADDR[*]}"
BOUNT_ADDR=${BOUNT_ADDR[*]} truffle test --network rpc
