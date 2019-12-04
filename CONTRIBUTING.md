# Contributing

🦄🚀Welcome to the space unicorn party🚀🦄

Contributions to Open Enterprise include code, documentation, answering user questions, running the project's infrastructure, and advocating for all types of DAOs.

This guide explains the process for contributing to the Open Enterprise project's core `open-enterprise/apps` GitHub Repository and describes what to expect at each step.

## Contents

- [Code of Conduct](#code-of-conduct)
- [Issues](#issues)
- [Pull Requests](#pull-requests)

## [Code of Conduct](./CODE_OF_CONDUCT.md)

The Open Enterprise project has a
[Code of Conduct](./CODE_OF_CONDUCT.md)
that _all_ contributors are expected to follow. This code describes the
_minimum_ behavior expectations for all contributors.

## Issues

### How to Contribute to Issues

For bug related issues, there are fundamentally three ways an individual can
contribute:

1. **Symptoms** - If you believe that you have uncovered a bug, open a [new issue](https://github.com/AutarkLabs/planning-suite/issues/new) labeled `bug`. Title the issue after the error message, or your best description of the _symptoms_ you've encountered, and provide detailed steps, with any additional context, for attempting to replicate the issue.
2. **Diagnosis** Provide a hypothesis as to what could be causing an issue, by commenting on the issue and suggesting procedures for testing that hypothesis.
3. **Treatment** - Provide suggestions on how to triage an issue.

## Pull Requests

There are two fundamental components of the Pull Request process: one technical, and one process-oriented. The technical component involves the specific details of setting up your local environment so that you can make the actual changes. This is where we will start.

## Environment Setup

We still need to document a comprehensive wiki on setting up the dev environment (want to help?), but this is what we have so far:

### Linux (Ubuntu/Debian) 

#### 1. Dependencies

First things first, update and upgrade your system
`sudo apt-get update && sudo apt-get upgrade`

then Install the dependencies
`sudo apt install build-essential git python`

#### 2. Install NVM
While you can install node manually, NVM makes managing your node installation much easier. Furthermore, you can have more than one version installed at the same time. 

**Note:** if you use another shell, zsh for example, replace `bash` with your shell
`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash`

this will install `nvm` and place it in your path.

Open a new terminal window and install node

`nvm install 10.15.3`

**Warning:** `node` version 12 is not compatible with Aragon Cli, `10.15.3` works well but the latest LTS version should work.

#### 3. Install Aragon CLI

`npm i -g @aragon/cli`

Since version 6.0.0 ipfs is not included with the cli so install it with

`aragon ipfs install`

#### 4. Configure the CLI
Finally, if you are not using frame as you signing provider (frame is highly recommended) you need to set up a private key for use with the CLI.

Create a new key and get some testnet ETH from the Rinkeby faucet

Sometimes the ~/.aragon folder is not included in the installation, which is a problem because that's where your private key goes.

`cd ~/.aragon`

If you get file not found run the devchain first,

`aragon devchain`

and try again.

Once you're in the `~/.aragon` folder you need to create a file that holds your private key.

Create a new file for your rinkeby key


`nano ~/.aragon/rinkeby_key.json`

This will open a blank file, copy and paste the following replacing the text with your private key

```
{
 "rpc": "https://rinkeby.aragon.network",
 "keys": [
 "put-your-priv-key-here"
 ]
}
```

now test out your configuration by launching a DAO on Rinkeby.

`
dao new --environment aragon:rinkeby
`

### Main Aragon documents/resources

- <https://wiki.aragon.org/>
- <https://hack.aragon.org/>
- <https://hack.aragon.org/docs/aragonos-intro.html>
- <https://hack.aragon.org/docs/tutorial>
- <https://github.com/aragon/aragon.js/blob/master/docs/APP.md>
- <https://github.com/aragon/aragon.js/blob/master/docs/WRAPPER.md>

The [Aragon App tutorial](https://hack.aragon.org/docs/tutorial) is probably the most helpful. As far as design, the app.md and wrapper.md are the most helpful for the front end and the hack gives the best overview. The aragonOS.md details the solidity code and how the core of their system works.

### Asking for General Help

Please feel free to direct questions or requests for general help in the [Aragon Planning riot channel](https://riot.im/app/#/room/#aragon-planning:matrix.org).

### Pull Request Process

Install the [ZenHub for Github](https://chrome.google.com/webstore/detail/zenhub-for-github/ogcgkffhplmphkaahpmffcafajaocjbd?hl=en-US) chrome extension.

After installing the extension:

- Navigate to the "Zenhub" tab within Github
- Self-assign yourself to an issue in the "Backlog"

1. Be in a branch that followings the naming convention [*issue id*]-[*issue description*] i.e. 1-contributing-instructions
2. Have a clearly documented solution that addresses the issue.
3. Have full test coverage for all new code (with some exceptions for front-end code)
4. Get reviewed by at least 1 core contributor (2 for first issues)
5. Pass all integration tests (code tests, and linting)
