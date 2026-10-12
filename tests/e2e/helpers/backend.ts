import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { cpSync } from 'node:fs';
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
  // The compiled fixture reads its migrations from beside itself; tsc does not copy .sql files.
  cpSync(resolve(cwd, 'drizzle'), resolve(cwd, 'node_modules/.cache/browser-fixture/drizzle'), {
    recursive: true,
  });
  const name = `simpul-browser-${randomUUID()}`;

  execFileSync(
    docker,
    [
      'run',
      '-d',
      '--rm',
      '--label',
      'pspt.test.project=simpul',
      '--label',
      'pspt.test.disposable=true',
      '--tmpfs',
      '/var/lib/postgresql/data:rw,size=256m',
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
    execFileSync(docker, ['rm', '-f', '-v', name], { stdio: 'pipe' });
    throw error;
  }

  return {
    baseUrl,
    stop: () => {
      child?.kill();
      execFileSync(docker, ['rm', '-f', '-v', name], { stdio: 'pipe' });
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

export async function connectBackend(
  page: Page,
  baseUrl: string,
  email = 'admin@pointstar.example',
) {
  await page.route(/\/api\/(v1|auth)\//, async (route) => {
    const url = new URL(route.request().url());

    await route.continue({ url: `${baseUrl}${url.pathname}${url.search}` });
  });
  await page.goto('/sign-in');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/);
  await page.waitForLoadState('networkidle');
}
