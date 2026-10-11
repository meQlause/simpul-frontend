import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';

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
  let baseUrl: string;

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
    baseUrl = await ready(child);
  } catch (error) {
    child?.kill();
    execFileSync(docker, ['rm', '-f', name], { stdio: 'pipe' });
    throw error;
  }

  return {
    baseUrl,
    stop: () => {
      child?.kill();
      execFileSync(docker, ['rm', '-f', name], { stdio: 'pipe' });
    },
  };
}

function ready(child: ChildProcess) {
  return new Promise<string>((accept, reject) => {
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
      const address = /BROWSER_FIXTURE_READY (http:\/\/127\.0\.0\.1:\d+)\n/.exec(output);

      if (address) {
        clearTimeout(timeout);
        accept(address[1]);
      }
    });
    child.once('exit', () => {
      clearTimeout(timeout);
      reject(new Error(output));
    });
  });
}

export async function connectBackend(page: Page, baseUrl: string) {
  const login = await page.request.post(`${baseUrl}/api/auth/sign-in/email`, {
    data: { email: 'admin@pointstar.example', password: 'test-password-123' },
  });

  expect(login.ok()).toBe(true);
  await page.route(/\/api\/(v1|auth)\//, async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${baseUrl}${url.pathname}${url.search}` });

    await route.fulfill({ response });
  });
}
