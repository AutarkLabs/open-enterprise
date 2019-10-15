#!/bin/bash
# IFS=$'\n'
cd ../../../../shared/integrations/StandardBounties
# cd ../../shared/integrations/StandardBounties

if [[ ! -f node_modules/.bin/truffle ]] ; then
  red='\e[1;31m%s\e[0m\n'
  printf "$red" "  Cannot find `pwd`/node_modules/.bin/truffle – did you run \`npm install\`?"
  printf "\n"
#   cd ../../../apps/projects
  exit 1
fi

BOUNT_ADDR=($(node_modules/.bin/truffle migrate --network development | grep "^0x[[:alnum:]]\{40\}"))
echo "Bounties Address: ${BOUNT_ADDR[*]}"
# BOUNT_ADDR=($(node_modules/.bin/truffle migrate --network development | grep "^0x[[:alnum:]]\{40\}"))
# echo "Alternate Bounties Address: ${BOUNT_ADDR[*]}"
#./node_modules/.bin/truffle version
#./node_modules/.bin/truffle migrate --network coverage
# cd ../../../apps/projects
# unset IFS
#BOUNT_ADDR=${BOUNT_ADDR[*]} truffle test --network rpc
echo "${BOUNT_ADDR[*]}"