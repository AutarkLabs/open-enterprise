#!/usr/bin/env node

// const execute = require('child_process').execSync

// const buildCommand = 'aragon run --kit PlanningSuite --kit-init autark'

console.log('Starting Planning Suite Kit... 🚀')

// execute(buildCommand, { stdio: 'inherit' })

const networks = require('@aragon/os/truffle-config').networks
const getNetwork = require('../helpers/networks.js')
