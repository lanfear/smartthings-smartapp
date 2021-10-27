# SmartThings SmartApp Rules API Example

# TODO: UPDATE THIS FILE PORTED FROM PUBLIC BRANCH AS-IS
# DESCRIPTION

This code is branched off [my working main repository](/lanfear/smartthings-smartapp) which contains a much more complex dual SmartApp setup with a React client Front-End that integrates with another SmartApp that was removed from this branch.  I attempted to branch this while the Rules SmartApp was still fairly isolated before I really move forward mixing it with the FrontEnd and other SmartApp in the main branch.

This code is a static long-running branch that has been pruned down to illustrate a working SmartApp that interfaces with the Rules API and creates a practical rule-set that I use for my needs.

This is targeted at hobbiest SmartApp developers who may be interested in a full-scale working application example.  For developers just wandering into the Samsung SmartThings developer space it may come across as overly-complicated and you may find better resources [at the SmartThings Community GitHub](https://github.com/SmartThingsCommunity) for introductary purposes.  However, none of those apps really put things together in a real world use-case which is what this example intends to do.

# DEVELOPMENT ENVIRONMENT SETUP

These steps are intentionally different than may of the example SmartApp Community examples.  I attempt to layout the explicit steps necessary to get a local development environment up and running.  This example cannot be hosted on automated web hosting platforms like other SmartThings Community examples.

## Prerequisites
1. Latest version of [NodeJS](https://nodejs.org) installed on your computer (must be version 14+)
2. [Yarn](https://yarnpkg.com) or [NPM](https://www.npmjs.com/) (`npm install -g yarn`)

## One-Time Setup Instructions

1) Clone this app to a local directory

2) [Download NGrok](https://ngrok.com/download) and put the ngrok.exe program in the `/server` subdirectory and set up a **FREE** account, then configure NGrok according to the basic setup instructions on the download page.
   - This is required assuming your development environment does not have a public-facing internet address
   - this service sets up a secure tunnel that is required for proper OAuth communication between Samsung Cloud, your SmartThings Hub and your locally running development web-server

3) Create a file named `server/.env.local` containing the following text
```
NODE_ENV=development
PORT=SETLOCALPORTNUMBER
RULE_APP_ID=SEENEXTSTEP
RULE_CLIENT_ID=SEENEXTSTEP
RULE_CLIENT_SECRET=SEENEXTSTEP
```
> Replace in `SETLOCALPORTNUMBER` with a local port of your choosing (suggest anything 5000-64000).  Note, we will use this again in Step #5.

4) [Setup The App In Samsung Developer Portal](doc/APPSETUP.md)

5) Modify `package.json` edit the `yarn tunnel` script set `YOURPORTFROMENVCONFHERE` to the value you set above in Step #3 for `PORT`.  
   - (TODO: Find a better way to deal with this manual coupling)   
6) Continue to the 'Everyday development instructions' below

## Everyday development instructions

Run all of these from the `package.json` located in the 'server' directory (`cd server` or point-click from VS code UI)
   1) `yarn` (to install the npm dependencies)
   2) `yarn tunnel` (start the ngrok proxy)
   3) `yarn start` (start the node express server hosting the SmartApp)
   4) [(Re)Verify The App In Samsung Developer Workspace](doc/APPVERIFY.md)
      - **You must do this everytime you start/restart `yarn tunnel` task**

## Runtime Development

Finally! You are ready to develop!  Once you make changes, you need to **stop and start ONLY the `yarn server` task**  

You **do not want or need to restart the `yarn tunnel` task**.  If you do so, you will need to follow steps above to re-verify your App Registration with the new URL after NGrok restarts.

When you make changes to the server/smartapp, and restart you do not need to uninstall or re-install a working development app.

# FEATURES
1) Functional Samsung SmartApp Developed On Current Platform and API
2) Implementation of new Rules API that creates rules directly from SmartApp configuration
3) Allows multiple installs of the app, in this example allowing many simlar rulesets to be defined for different locations in a home/office
4) Proper node express server, with middleware options (NOTE: No authorization configured SEE NOTE BELOW)
5) **Full TypeScript application**, almost entirely accurate TS definitions used
6) Configured to run with new, experimental ESM support coming standard in pending Node minor release
7) Strict ESLint configuration and adherance (NOTE: should integrate ESLint into git commit hooks)
8) Complete and Accurate (hopefully, I tried!) SmartThings setup documentation with images and code snippets
9) Stable VSCode integration, ready for use with npm, yarn and eslint (and other) VSCode plugins
10) Proper seperation of 'development' vs 'production' libraries for efficient and minimal runtime env
11) Proper setup and use of 'dotenv' to safely store security data away from repository
12) (Extra) Simple, but exemplified persistent storage (JSONdb) linking web-app stored data to server stored data
13) (Extra) SSE (server-side-events) available to also pipe communication between server and smartapp (not heavily leveraged in this example, but left in code)

# CAVEATS/CONSIDERATIONS/BUGS
1) **The node express website is entirely unauthenticated!!**
   - The smartapp interaction is properly guarded by SmartThings OAuth protocol and library, but the endpoints hosted off the Express server are public!  I strongly recommend only exposing endpoints not associated with the webapps internally or building out proper auth mechanisms on the other Express endpoints
2) Custom, personal SmartApps cannot be shared across users =(
   - So, after all this work, and setting up many SmartApps to customize the rules in my home, I was disappointed to find out my wife could not see and control the SmartApps I had set up
3) You are limited to [100 Rules/User and 50 Rules/ISA](https://developer-preview.smartthings.com/docs/advanced/rate-limits/#rules)
   - So, after I configured about 12-15 SmartApps in my home, I started getting 'Too Many Requests' returned from the API when setting more rules, this is what the API returns
4) Very 'perscriptive' ESLint RuleSet
   - I feel that the 'default' ESLint ruleset, while a good start, does not demand enough coding standards and consistent practices, so I leveraged a specific ruleset with which I am familiar that is a lot more explicit.  Relax or tune this as you wish if you do not like the standards that are defined.

# RELEASE/PRODUCTION
1) run `yarn build` (builds into `/build` directory)
2) check-in or otherwise copy that output to build server hosting directory
3) `yarn --prod` on server to install neccessary runtime libs
4) `yarn prod` to run the server environment (or put the code in the script in a .service file)

# CREDITS

1) [Rule Helper Sample Project](/jodyalbritton/rule-helper) - this is the basis of this repository with some early commits cherry-picked from this repository.  Full credit to him for some of the fundamental bits here!
2) [SmartThings Community (Forums)](https://community.smartthings.com/) - to all those who take time to talk and support the community here
3) [SmartThings Community (GitHub)](/SmartThingsCommunity) - example projects from Samsung public for the community!  Many thanks and bits taken from the examples here
4) [SmartThings Community TypeScript Example](SmartThingsCommunity/smartapp-example-open-close-nodets) - many TS hints scrounged from here
5) [SmartThings Community All Settings Example](https://github.com/SmartThingsCommunity/smartapp-example-every-setting-nodejs) - useful example of settings options
6) [Rules API reference](https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/createRule) - rules API reference (and other docs)

# CONTRIBUTIONS AND UPDATES

I am essentially contributing this branch, as-is, to the community to extend, develop, use as a start, whatever.  But...

I really don't intend to develop this branch much further or clean/refine it.  I will attempt to back-port major bugs or vulnerabilities, but really this is just branched off at this point-in-time to be used as example code.

I _MAY_ consider fork contributions if contacted or PR(s) if I end up having them configured.  My hesitation is only with regards to my time, of which I don't have much to spare.  I am not trying to discourage community participation.

I really intend to continue to build out the `main` branch of this repository according to my needs and that will also remain public for example(s) although it may become much more complicated.
