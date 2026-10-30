# SmartThings SmartApp Rules API Example

# DESCRIPTION

This code is branched off [my working main repository](/lanfear/smartthings-smartapp) which contains a much more complex dual SmartApp setup with a React client Front-End that integrates with another SmartApp that was removed from this branch.  I attempted to branch this while the Rules SmartApp was still fairly isolated before I really move forward mixing it with the FrontEnd and other SmartApp in the main branch.

This code is a static long-running branch that has been pruned down to illustrate a working SmartApp that interfaces with the Rules API and creates a practical rule-set that I use for my needs.

This is targeted at hobbiest SmartApp developers who may be interested in a full-scale working application example.  For developers just wandering into the Samsung SmartThings developer space it may come across as overly-complicated and you may find better resources [at the SmartThings Community GitHub](https://github.com/SmartThingsCommunity) for introductary purposes.  However, none of those apps really put things together in a real world use-case which is what this example intends to do.

# DEVELOPMENT ENVIRONMENT SETUP

These steps are intentionally different than may of the example SmartApp Community examples.  I attempt to layout the explicit steps necessary to get a local development environment up and running.  This example cannot be hosted on automated web hosting platforms like other SmartThings Community examples.

## Prerequisites
1. Latest version of [NodeJS](https://nodejs.org) installed on your computer (known to work with 18+)

## One-Time Setup Instructions

1) Clone this app to a local directory

2) [Download NGrok](https://ngrok.com/download) and set up a **FREE** account, then configure NGrok according to the basic setup instructions on the download page.
   - This is required assuming your development environment does not have a public-facing internet address
   - this service sets up a secure tunnel that is required for proper OAuth communication between Samsung Cloud, your SmartThings Hub and your locally running development web-server
   - After installing and setting it up, you do not need to manually run it, the node script `server-tunnel` runs ngrok internally

3) Create a file named `server/.env.local` containing the following text

```
ENV_TYPE=dev|prod
STHOST=localhost # (empty for *)
STPORT=SETLOCALPORTNUMBER
API_TOKEN=SEENEXTSTEPPART2
CONTROL_APP_ID=SEENEXTSTEP
CONTROL_CLIENT_ID=SEENEXTSTEP
CONTROL_CLIENT_SECRET=SEENEXTSTEP
RULE_APP_ID=SEENEXTSTEP
RULE_CLIENT_ID=SEENEXTSTEP
RULE_CLIENT_SECRET=SEENEXTSTEP
LOCALIPS=192.168.1.1/24,127.0.0.1,::ffff:127.0.0.1,::1 # (your local nets)
LOGGING_EVENTS_ENABLED=false # or true
REDIS_SERVER=LOCALREDISPORT # TODO: document redis setup
MEASUREMENT_POLL_MINUTES=5 # optional, how often temperature/humidity readings are recorded for history graphs (0 disables)
MEASUREMENT_RETENTION_DAYS=30 # optional, how many days of recorded readings to keep in redis
```

> Replace in `SETLOCALPORTNUMBER` with a local port of your choosing (suggest anything 5000-64000).

> Replace `LOCALIPLIST` with a comma-separated list of IPV4, IPV6 and CIDR-Range addresses (i.e. `192.168.1.0/28,127.0.0.1,::ffff:127.0.0.1,::1`)

1) [Setup The App In Samsung Developer Portal](doc/APPSETUP.md)
   1) Setup a Samsung PWT (TODO: document this process)

2) Continue to the 'Everyday development instructions' below

## Everyday development instructions

Run all of these from the single top-level `package.json` (there are no per-folder `package.json` files; client scripts are prefixed `client-` and server scripts `server-`)
   1) `npm install` (installs dependencies for both client and server)
   2) `npm run start` will start entire dev environment in a single console session (using concurrently)
      1) alternatively, you can run individual parts of the `npm run start` command above to control each part individually (`npm run server-tunnel`, `npm run server-start`, `npm run client-start`)
      2) `npm run start` also re-runs lint on every source change (the `all|lint` process) — it only reports problems, it never blocks the build or host; `npm run lint` runs it once by hand, and `npm run lint:fix` applies eslint's auto-fixes
   3) [(Re)Verify The App In Samsung Developer Workspace](doc/APPVERIFY.md)
      - **You must do this every time you start/restart `npm run server-tunnel` task which includes every time you run the main `npm run start` command**

## Runtime Development

Finally! You are ready to develop!  Server and client changes are picked up automatically: the watchers rebuild and restart the server host / rebuild the client on file changes.

To force a restart (eg. after a crash), type into the `npm run start` console and press enter:
- `rs` — restart the server host (the default target)
- `<name>:rs` or `<index>:rs` — restart another process, eg. `server|build:rs` or `3:rs` (names and indexes are `0 server|tunnel`, `1 server|build`, `2 server|host`, `3 client|build`, `4 client|host`, `5 all|lint`)

You **do not want or need to restart the `server|tunnel` process**, and nothing above restarts it.  If you do restart it (including stopping `npm run start` with Ctrl-C), you will need to follow steps above to re-verify your App Registration with the new URL after NGrok restarts.

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
9) Stable VSCode integration, ready for use with npm and eslint (and other) VSCode plugins
10) Proper seperation of 'development' vs 'production' libraries for efficient and minimal runtime env
11) Proper setup and use of 'dotenv' to safely store security data away from repository
12) (Extra) Simple, but exemplified persistent storage (redis) linking web-app stored data to server stored data
13) (Extra) SSE (server-side-events) available to also pipe communication between server and smartapp (not heavily leveraged in this example, but left in code)

# CAVEATS/CONSIDERATIONS/BUGS
1) **The node express website only protected by local ip detection**  This is not considered adequate protection by web security experts.
2) Custom, personal SmartApps cannot be shared across users =(
   - So, after all this work, and setting up many SmartApps to customize the rules in my home, I was disappointed to find out my wife could not see and control the SmartApps I had set up
3) You are limited to [100 Rules/User and 50 Rules/ISA](https://developer-preview.smartthings.com/docs/advanced/rate-limits/#rules)
   - I have now made improvements to collapse rules down to only 2 max per app install, but you can still hit this limit with enough apps installed
4) Very 'perscriptive' ESLint RuleSet
   - I feel that the 'default' ESLint ruleset, while a good start, does not demand enough coding standards and consistent practices, so I leveraged a specific ruleset with which I am familiar that is a lot more explicit.  Relax or tune this as you wish if you do not like the standards that are defined.

# RELEASE/PRODUCTION
1) run `npm run build` (builds into `server/build` and `client/build` directories)
2) check-in or otherwise copy that output to build server hosting directory
3) be sure to configure the `server/.env` (or `server/.env.local`) file on the server checkout directory
4) `npm install --omit=dev` on server to install neccessary runtime libs (client libraries are dev dependencies since they are bundled at build time)
5) `npm run server-host` to run the server environment (or put the code in the script in a .service file; `npm run server-prod` still works as an alias for existing setups)

## Updating a server checkout

`npm run deploy` (`tools/deploy.mts`) updates a git checkout on the server to `origin/main` (discarding local changes), does a clean `npm ci` (dev deps included, since it builds in place), runs `npm run build`, restarts the service and follows its log. It only uses node built-ins and finds the repo from its own location; add these to `server/.env.local` (or `server/.env`) on the server:

```
DEPLOY_SERVICE=YOURSERVICENAME # name passed to `service <name> restart`
DEPLOY_LOG=/path/to/server.log # file to follow after restart
```

Then run `sudo npm run deploy` from the checkout (or as whichever user can restart the service). The restart and log-follow steps use `service` and `tail`, so this part expects a Linux host.

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

# MY TODO LIST

- Why doesnt add imports map the proper file (or even always show node-modules available for client?) 
  - https://medium.com/geekculture/avoid-relative-path-hell-in-typescript-backend-41417b0086b7 seems good idea in its own PR
- Autoformatter settings figured out? may need to upgrade eslint and the rules?? (wip: 7c3506f upgrade typescript, separate PR)
- lint on checkin?
- advanced logging and log routings (categories, enable/disable in .env, verbose logging to specific file, some/all captured by syslog?)
- different icons for different light types (fan, fanlight, light, ??)
- show % of dim instead of on/off
- .env for client being baked into production build
