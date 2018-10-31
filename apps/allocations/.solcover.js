module.exports = {
  norpc: true,
  // TODO: Change this hack when the feel to update solidity-coverage upstream
  // rsync is needed so symlinks are resolved on copy of lerna packages
  testCommand:
    'mkdir -p node_modules/@tps/test-helpers \
    && rsync -r ../node_modules/@tps/test-helpers/contracts node_modules/@tps/test-helpers/ \
    && node --max-old-space-size=4096 ../../../node_modules/.bin/truffle test --network coverage',
}
