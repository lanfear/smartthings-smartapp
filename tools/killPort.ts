// standalone replacement for the `kill-port` npm package - run directly via `node tools/killPort.ts <port>`
// (this repo already runs plain .ts files with `node` elsewhere, eg. client/tool/bundle.ts, relying on Node's
// built-in TypeScript support rather than a separate ts-node/tsx dependency)
import {execSync} from 'node:child_process';

const findWindowsPids = (port: number): string[] => {
  let output = '';
  try {
    output = execSync('netstat -ano -p TCP', {encoding: 'utf8'});
  } catch {
    return [];
  }

  const pids = new Set<string>();
  for (const line of output.split('\n')) {
    const match = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
    if (match && Number(match[1]) === port) {
      pids.add(match[2]);
    }
  }
  return [...pids];
};

const findPosixPids = (port: number): string[] => {
  try {
    const output = execSync(`lsof -t -i:${port} -sTCP:LISTEN`, {encoding: 'utf8'});
    return output.split('\n').map(line => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const killPid = (pid: string, port: number): void => {
  const killCommand = process.platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
  console.log(execSync(killCommand).toString());
  console.log(`Killed process ${pid} on the target port ${port}`);
};

const main = (): void => {
  const portArg = process.argv[2];
  const port = Number(portArg);
  if (!portArg || Number.isNaN(port)) {
    console.error('Usage: node tools/killPort.ts <port>');
    process.exitCode = 1;
    return;
  }

  const pids = process.platform === 'win32' ? findWindowsPids(port) : findPosixPids(port);

  if (pids.length === 0) {
    console.log(`No process found listening on port ${port}`);
    return;
  }

  for (const pid of pids) {
    try {
      killPid(pid, port);
    } catch (ex) {
      console.error(`Failed to kill process ${pid}:`, ex);
    }
  }
};

main();
