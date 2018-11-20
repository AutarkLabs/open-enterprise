# Contributing

🦄🚀Welcome to the space unicorn party🚀🦄

Contributions to That Planning App include code, documentation, answering user questions, running the project's infrastructure, and advocating for all types of DAOs.

This guide explains the process for contributing to the Planning App project's core `planning-suite/apps` GitHub Repository and describes what to expect at each step.

## Contents

* [Code of Conduct](#code-of-conduct)
* [Issues](#issues)
* [Pull Requests](#pull-requests)

## [Code of Conduct](./CODE_OF_CONDUCT.md)

The Planning App project has a
[Code of Conduct](./CODE_OF_CONDUCT.md)
that *all* contributors are expected to follow. This code describes the
*minimum* behavior expectations for all contributors.

## Issues

### How to Contribute in Issues

For bug related issues, there are fundamentally three ways an individual can
contribute:

1. **Symptoms** - If you believe that you have uncovered a bug, open a [new issue](https://github.com/spacedecentral/planning-suite/issues/new) labeled `bug`. Title the issue after the error message, or your best description of the *symptoms* you've encountered, and provide detailed steps, with any additional context, for attempting to replicate the issue.
2. **Diagnosis** Provide a hypothesis as to what could be causing an issue, by commenting on the issue and suggesting procedures for testing that hypothesis.
3. **Treatment** - Provide suggestions on how to triage an issue.



## Pull Requests

There are two fundamental components of the Pull Request process: one technical, and one process oriented. The technical component involves the specific details of setting up your local environment so that you can make the actual changes. This is where we will start.

### Environment Setup

We still need to document a comprehensive wiki on setting up the dev environment (want to help?), but this is what we have so far:

### Main Aragon documents/resources

* https://wiki.aragon.one/dev/
* https://github.com/aragon/aragonOS/blob/docs/docs/aragonOS.md
* https://github.com/aragon/hack
* https://gist.github.com/izqui/2a02c337aafa225c403de9c988cb78a0
* https://github.com/aragon/aragon.js/blob/master/docs/APP.md
* https://github.com/aragon/aragon.js/blob/master/docs/WRAPPER.md

The WIP gist is probably the most helpful but also the most incomplete. If you follow the instructions, you'll run into some issues with some assumptions made about the APM permissions. As far as design, the app.md and wrapper.md are the most helpful for the front end, and the hack.md gives the best overview. The aragonOS.md details the solidity code and how the core of their system works. 

### Asking for General Help

Please feel free to direct questions or requests for general help in the [Aragon Planning riot channel](https://riot.im/app/#/room/#aragon-planning:matrix.org).

### Pull Request Process

Install the [ZenHub for Github](https://chrome.google.com/webstore/detail/zenhub-for-github/ogcgkffhplmphkaahpmffcafajaocjbd?hl=en-US) chrome extension.

After installing the extension:

* Navigate to the "Zenhub" tab within Github
* Self-assign yourself to an issue in the "Backlog"

1. Be in a branch that followings the naming convention [*issue id*]-[*issue description*] i.e. 1-contributing-instructions
2. Have a clearly documented solution that addresses the issue.
3. Have full test coverage for all new code (with some exceptions for front-end code)
4. Get reviewed by at least 1 core contributor (2 for first issues)
5. Pass all integration tests (code tests, and linting)
