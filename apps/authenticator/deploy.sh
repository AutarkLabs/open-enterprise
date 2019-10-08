#!/usr/bin/env bash

DIR="$(dirname "${BASH_SOURCE[0]}")"

blu=$'\e[1;34m'
end=$'\e[0m'

echo starting ipfs...
aragon ipfs start &
sleep 10

HASH=`ipfs add -Q $DIR/public/index.html`
printf "\nAdded current index.html to local ipfs.\n\n"

printf "Propogating to gateways...\n\n"
printf "This could take a while. While it runs, you may want to update the OAuth App settings on GitHub.\n"
printf "  → Go to https://github.com/organizations/AutarkLabs/settings/applications/953918\n"
printf "%s\n" "  → Set the ${blu}Authorization Callback URL${end} to ${blu}https://ipfs.eth.aragon.network/ipfs/$HASH${end}"
aragon ipfs propagate $HASH

PROPOGATION_STATUS=$?

printf "\nStopping ipfs...\n"
pkill ipfs

exit $PROPOGATION_STATUS
