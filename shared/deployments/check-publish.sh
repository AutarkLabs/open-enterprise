#!/bin/bash

git diff --quiet HEAD~ HEAD -- $PWD/contracts

if [ $? == "1" ]
then
  aragon apm publish major --files dist/ --environment continuous-deployment --apm.ipfs.rpc https://ipfs.autark.xyz:5001 --ipfs-check false --propagate-content false --skip-confirmation --no-prepublish
  exit $?
else 
  echo "no contract changes"
fi

git diff --quiet HEAD~ HEAD -- $PWD/app $PWD/../../shared/identity $PWD/../../shared/lib $PWD/../../shared/store-utils $PWD/../../shared/ui $PWD/../../shared/utils

if [ $? == "1" ]
then
  npm run compile # remove after CLI is bumped to v6 or higher
  aragon apm publish minor --files dist/ --environment continuous-deployment --apm.ipfs.rpc https://ipfs.autark.xyz:5001 --ipfs-check false --propagate-content false --skip-confirmation
  exit $?
else
  echo "no patch changes"
fi

exit 0
