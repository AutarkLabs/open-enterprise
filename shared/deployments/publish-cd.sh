#!/bin/bash
IFS=$'\n'
APP_CIDs=($(lerna run publish:cd --no-ci | grep -o "Qm[[:alnum:]]\{44\}$"))
unset IFS
echo number of apps published: ${#APP_CIDs[*]}

for cid in "${APP_CIDs[@]}"
do
  echo propagating $cid ... $'\n'
  aragon ipfs propagate $cid > /dev/null &
  sleep 20
done
