# Contributing

🦄🚀Welcome to the space unicorn party🚀🦄

This is the project repo for [Aragon Nest proposal #24](https://github.com/aragon/nest/pull/24)

In order to get started contributing please find an issue marked "good first issue" and look over our rules for pull requests.

### Background Material
* [White Paper](https://drive.google.com/open?id=192hg6lUoePoWh_zR2uCyIHcw7TYH4gEc7CoUMZ1lkl8)
* [Design Files](https://invis.io/U2HNX5CST9W)

## Environment Setup

We still need to document a comprehensive wiki on setting up the dev environment (want to help?), but this is what we have so far:

Main resources:
* https://wiki.aragon.one/dev/
* https://github.com/aragon/aragonOS/blob/docs/docs/aragonOS.md
* https://github.com/aragon/hack
* https://gist.github.com/izqui/2a02c337aafa225c403de9c988cb78a0
* https://github.com/aragon/aragon.js/blob/master/docs/APP.md
* https://github.com/aragon/aragon.js/blob/master/docs/WRAPPER.md

Those are the main Aragon documents, the WIP gist is probably the most helpful but also the mod incomplete. If you follow the instructions you'll run into some issues with some assumptions made about the APM permissions. As far as design the app.md and wrapper.md are the most helpful for the front end, and the hack.md gives the best overview. The aragonOS.md details the solidity code and how the core of their system works.

## Project Management

We use Zenhub's Github Chrome Extension for project management, so [please install it](https://chrome.google.com/webstore/detail/zenhub-for-github/ogcgkffhplmphkaahpmffcafajaocjbd?hl=en-US).


## Pull Requests

In order for a pull request to get accepted it needs to:

1. Be in a branch that followings the naming convention [*issue id*]-[*issue description*] i.e. 1-contributing-instructions
2. Have a clearly documented solution that addresses the issue.
3. Have full test coverage for all new code (with some exceptions for front-end code)
4. Get reviewed by at least 1 core contributor (2 for first issues)
5. Pass all integration tests (code tests, and linting)

## Contributor Status and Compensation

All issues are assigned an hour estimate in "points" by our team during our twice weekly meetings using planning poker. You can only see the points if you install the Zenhub extension, so [please install it](https://chrome.google.com/webstore/detail/zenhub-for-github/ogcgkffhplmphkaahpmffcafajaocjbd?hl=en-US).

In order to get added as a contributor and get an invite to our meetings you need to accumulate at least 20 contributor points. For each hour in completed tasks a contributor gets 1 contributor point. This means if you complete tasks with weights 8 and 7 you could not attend meetings but after completing another with at least a weight of 5 you could!

Every month we allocate ~5,000 USD (ether fluctuates) to a reward pool (that we call "RewardDAO"). In order to be eligible all you need to do is complete a task with a given weight. At the end of the milestone (which can span in some cases span multiple months), we divide our RewardDAO budget evenly based on total points of contributions. Regular Reward members of the repository are not eligible for the RewardDAO so don't worry about us taking all those delicious points!

Currently payouts are handled manually using a multi-sig however in the future all of this should be automated through the software we're building.

### Regular Reward Members
The following "Regular Reward Members" of the repository are not eligible for the RewardDAO so don't worry about us taking all those delicious points!
* quazia
* stellarmagnet
* rkzel

## Contact

We can generally be found in the [Aragon Planning riot channel](https://riot.im/app/#/room/#aragon-planning:matrix.org)

You may also reach out to us via email at: nest@space.coop

If you have any questions or want to get involved in our development please let us know!

## Special Thanks

Special thanks go to the Aragon team for much of the work this project is based on as well as for allocating us this grant to build the tools we need to DAOify open source developemt!
