module.exports = {
  norpc: true,
  // TODO: Change this hack when the feel to update solidity-coverage upstream
  // rsync is needed so symlinks are resolved on copy of lerna packages
  copyPackages: ['@tps/test-helpers'],
  skipFiles: [
    'test/TestRangeVoting.sol',
    'test/mocks/ExecutionTarget.sol',
    'test/mocks/RangeVotingMock.sol',
  ]
}
