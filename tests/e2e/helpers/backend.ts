import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

const docker =
  process.platform === 'win32'
    ? 'C:/Program Files/Docker/Docker/resources/bin/docker.exe'
    : '/usr/bin/docker';

export async function startBackend() {
  const cwd = resolve(process.env.SIMPUL_BACKEND_PATH ?? '../backend');
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      '-p',
      'tsconfig.json',
      '--noEmit',
      'false',
      '--outDir',
      'node_modules/.cache/browser-fixture',
    ],
    { cwd, stdio: 'pipe' },
  );
  const name = `simpul-browser-${randomUUID()}`;
  execFileSync(
    docker,
    [
      'run',
      '-d',
      '--rm',
      '--name',
      name,
      '-e',
      'POSTGRES_HOST_AUTH_METHOD=trust',
      '-p',
      '127.0.0.1::5432',
      'pgvector/pgvector:0.8.7-pg15-trixie',
    ],
    { stdio: 'pipe' },
  );
  let child: ChildProcess | undefined;
  try {
    const address = execFileSync(docker, ['port', name, '5432'], { encoding: 'utf8' }).trim();
    child = spawn(
      process.execPath,
      ['node_modules/.cache/browser-fixture/tests/helpers/browser-server.js'],
      {
        cwd,
        env: {
          ...process.env,
          DATABASE_URL: `postgres://postgres@${address}/postgres`,
          SIMPUL_BROWSER_FIXTURE: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    await ready(child);
  } catch (error) {
    child?.kill();
    execFileSync(docker, ['rm', '-f', name], { stdio: 'pipe' });
    throw error;
  }
  return () => {
    child?.kill();
    execFileSync(docker, ['rm', '-f', name], { stdio: 'pipe' });
  };
}

function ready(child: ChildProcess) {
  return new Promise<void>((accept, reject) => {
    let output = '';
    const timeout = setTimeout(
      () => reject(new Error(output || 'Browser API did not start')),
      30000,
    );
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes('BROWSER_FIXTURE_READY')) {
        clearTimeout(timeout);
        accept();
      }
    });
    child.once('exit', () => {
      clearTimeout(timeout);
      reject(new Error(output));
    });
  });
}
