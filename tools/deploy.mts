/* eslint-disable no-console */
// update, build, and restart the production install, then follow its log - run on the server via `npm run deploy`
//
// the repo location comes from this script's own path; the service name and log file come from DEPLOY_SERVICE /
// DEPLOY_LOG in server/.env.local (or server/.env), so no host details live in git.
// only node built-ins are used, since `npm ci` below replaces node_modules while this is running
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseEnv} from 'node:util';

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const fail = (message: string): never => {
  console.error(`deploy: ${message}`);
  process.exit(1);
};

// run a command in the repo with output streamed to this terminal, stopping the deploy if it fails
const run = (command: string, args: string[]): void => {
  console.info(`\n> ${[command, ...args].join(' ')}`);
  const result = spawnSync(command, args, {cwd: repoDir, stdio: 'inherit'});
  if (result.error) {
    fail(`could not run ${command}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${command} exited with code ${result.status ?? result.signal}`);
  }
};

// run npm through the same npm that launched `npm run deploy` (avoids npm vs npm.cmd differences between systems)
const runNpm = (args: string[]): void => {
  const npmCli = process.env.npm_execpath;
  if (npmCli) {
    run(process.execPath, [npmCli, ...args]);
  } else {
    run('npm', args);
  }
};

const readDeploySettings = (): {service: string; logFile: string} => {
  const envFile = ['server/.env.local', 'server/.env']
    .map(f => path.join(repoDir, f))
    .find(f => fs.existsSync(f)) ?? fail(`no server/.env.local or server/.env found in ${repoDir}`);

  // parse only - nothing in the file is ever executed
  const env = parseEnv(fs.readFileSync(envFile, 'utf8'));
  const service = env.DEPLOY_SERVICE ?? fail(`DEPLOY_SERVICE is not set in ${envFile}`);
  const logFile = env.DEPLOY_LOG ?? fail(`DEPLOY_LOG is not set in ${envFile}`);
  return {service, logFile};
};

const main = (): void => {
  const {service, logFile} = readDeploySettings();

  run('git', ['fetch']);
  run('git', ['checkout', 'main']);
  run('git', ['reset', '--hard', 'origin/main']);

  // leftovers from before client/ and server/ shared the root package.json - node would resolve these stale
  // copies before the root node_modules, so they must not survive
  for (const stale of ['client/node_modules', 'server/node_modules']) {
    const stalePath = path.join(repoDir, stale);
    if (fs.existsSync(stalePath)) {
      console.info(`\nremoving legacy ${stale}`);
      fs.rmSync(stalePath, {recursive: true, force: true});
    }
  }

  // exact lockfile install; dev deps are needed to build (tsc, esbuild)
  runNpm(['ci', '--include=dev']);
  runNpm(['run', 'build']);

  // validate both .envs

  run('service', [service, 'restart']);
  run('tail', ['-n', '200', '-f', logFile]);
};

main();
