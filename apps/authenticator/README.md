Simple OAuth Authenticator
==========================

Here's how signing into GitHub from the Projects app works:

1. From **Projects** (in iframe; served from `https://ipfs.eth.aragon.network/ipfs/`): calls `window.open` to open a popup.
2. The **popup** loads `https://github.com/login/oauth/authorize`; the user signs in; GitHub redirects to the Authorization Callback URL configured for [our GitHub OAuth App](https://github.com/organizations/AutarkLabs/settings/applications/953918), providing it a `code` (we can specify this using a `redirect_uri` parameter to GitHub, but this `redirect_uri` [must match-with-more-specificity](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#redirect-urls) the URL we already configured).
3. The **popup** loads our Authorization Callback URL, which calls `opener.postMessage({ code })` – this `opener` refers to the page that opened this popup.
4. The **Projects** app is that page (hopefully! see security note below); it listens for these posted messages, grabs the code, and hits a lightweight server process where our OAuth App's server-side key is stored, which uses the code to load an authentication token for that user. The Projects app saves that token so it can make calls to GitHub as the user.

This mini app deals with Step 3 above.


Security Note
=============

Note that any app, not just Projects, could open a popup that loads the OAuth page for our app, which dutifully redirects to this app. If this app blindly passed `code` to the calling page, it would allow any app to sign in users using our GitHub OAuth App. That's why this app checks the identity of `window.opener` against known versions of the Projects app.


Deployment
==========

You will need [aragonCLI](https://hack.aragon.org/docs/cli-intro.html) installed globally: `npm i -g @aragon/cli`

The `npm run deploy` script will walk you through the rest. Key concept: if you update this app, you have to update the settings on GitHub. We have not yet scripted this piece. So:

1. Update the code
2. Run `npm run deploy`; this will spin up a local ipfs node, add `index.html`, and propogate it to the `ipfs.eth.aragon.network` gateway
3. Update GitHub settings with the new URL
