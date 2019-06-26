instructions for running this stuff so i don't forget:

Right now address book is forwarded through discussions (instead of voting), so you create new discussion threads by creating new address book entries

Only issue is latest @aragon/api doesn't work with forwarding? Need to check that out.

So first you `npm i @aragon/api`, then you launch the DAO, create a few new address book entries

Launching the dao with `npm run start:no:client`, then go to your aragon/aragon repo and run `npm run start:local`

Then you `npm link @aragon/api` to get the local api running. I'm running that on branch `discussions-testing`. Make sure you `npm run build` in the aragon/api repo (and have linked all local dependencies there too). YOu also have to rebuild any scripts that were using this as well lol. Sorry for any confusion! :D

