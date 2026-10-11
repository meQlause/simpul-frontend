import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';
import compiler from 'typescript';
import { inspectImports } from '../../helpers/architecture';

test.each([
  ['C-1', 'src/features/work/WorkPage.tsx', "import { person } from '../people/people.schema';"],
  ['C-1', 'src/features/work/WorkPage.tsx', "export { person } from '../people/private/index';"],
  ['C-1', 'src/features/work/WorkPage.tsx', "const person = import('../people/people.schema');"],
  ['C-1', 'src/features/work/WorkPage.tsx', "const person = require('../people/people.schema');"],
  [
    'C-2',
    'src/shared/format/date.ts',
    "import type { Person } from '../../features/people/people.schema';",
  ],
  ['C-2', 'src/shared/format/date.ts', "import { routes } from '../../app/router';"],
  [
    'C-3',
    'src/features/work/WorkPage.tsx',
    "import { getResponse } from '../../shared/api/client';",
  ],
  ['C-3', 'src/app/providers.tsx', "export { getResponse } from '../shared/api/client';"],
  ['C-4', 'src/shared/ui/Button.tsx', "import { ApiError } from '../api/error';"],
  [
    'C-4',
    'src/shared/ui/Button.tsx',
    "import type { Person } from '../../features/people/people.schema';",
  ],
  ['C-4', 'src/shared/ui/Button.tsx', "fetch('/api/v1/people');"],
  ['C-4', 'src/shared/ui/Button.tsx', "window.fetch('/api/v1/people');"],
  ['C-4', 'src/shared/ui/Button.tsx', 'new XMLHttpRequest();'],
])('%s rejects the forbidden dependency in %s', (rule, path, source) => {
  expect(inspectImports(path, source)).toContain(rule);
});

test.each([
  ['src/features/work/WorkPage.tsx', "import { PeoplePage } from '../people';"],
  ['src/features/work/WorkPage.tsx', "import { PeoplePage } from '../people/index.ts';"],
  ['src/features/work/WorkPage.tsx', "import { schema } from './work.schema';"],
  ['src/features/work/work.api.ts', "import { getResponse } from '../../shared/api/client';"],
  ['src/shared/ui/Button.tsx', "// fetch('/example');\nconst title = 'fetch';"],
])('allows the public boundary in %s', (path, source) => {
  expect(inspectImports(path, source)).toEqual([]);
});

test('C-3 resolves a configured TypeScript alias before enforcing the API boundary', () => {
  expect(
    inspectImports('src/app/providers.tsx', "import { getResponse } from '@/shared/api/client';", {
      baseUrl: process.cwd(),
      paths: { '@/*': ['src/*'] },
    }),
  ).toContain('C-3');
});

test('tests/unit/architecture/imports.test.ts enforces C-1 to C-4 on every source file', () => {
  const config = compiler.readConfigFile('tsconfig.json', compiler.sys.readFile);
  const options = compiler.parseJsonConfigFileContent(
    config.config,
    compiler.sys,
    process.cwd(),
  ).options;
  const files = readdirSync('src', { recursive: true, withFileTypes: true });
  const violations = files
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .flatMap((entry) => {
      const path = join(entry.parentPath, entry.name);

      return inspectImports(relative(process.cwd(), path), readFileSync(path, 'utf8'), options).map(
        (rule) => `${path}: ${rule}`,
      );
    });

  expect(violations).toEqual([]);
});
