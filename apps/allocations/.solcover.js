module.exports = {
  norpc: true,
  // rsync is needed so symlinks are resolved on copy of lerna packages
  testCommand: 'truffle test --network coverage',
  copyPackages: ['@tpt/test-helpers'],
}
