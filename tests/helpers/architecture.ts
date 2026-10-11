import { posix, relative, resolve } from 'node:path';
import compiler from 'typescript';

type ImportContext = { path: string; target: string; feature?: string; targetFeature?: string };

const importRules = {
  'C-1': (context: ImportContext) =>
    Boolean(context.feature && context.targetFeature) &&
    context.feature !== context.targetFeature &&
    context.target !== `src/features/${context.targetFeature}/index.ts` &&
    context.target !== `src/features/${context.targetFeature}`,
  'C-2': (context: ImportContext) =>
    context.path.startsWith('src/shared/') &&
    (context.target.startsWith('src/features/') || context.target.startsWith('src/app/')),
  'C-3': (context: ImportContext) =>
    !context.path.endsWith('.api.ts') &&
    /^src\/shared\/api\/client(?:\.[cm]?[jt]sx?)?$/.test(context.target),
  'C-4': (context: ImportContext) =>
    context.path.startsWith('src/shared/ui/') &&
    (context.target.startsWith('src/shared/api/') || context.target.startsWith('src/features/')),
};

function targetFor(path: string, module: string, options: compiler.CompilerOptions) {
  const resolved = compiler.resolveModuleName(
    module,
    resolve(path),
    options,
    compiler.sys,
  ).resolvedModule;

  if (resolved) {
    return relative(process.cwd(), resolved.resolvedFileName).replaceAll('\\', '/');
  }

  if (module.startsWith('.')) {
    return posix.normalize(posix.join(posix.dirname(path), module));
  }

  return module;
}

function contextFor(
  path: string,
  module: string,
  options: compiler.CompilerOptions,
): ImportContext {
  const target = targetFor(path, module, options);

  return {
    path,
    target,
    feature: path.match(/^src\/features\/([^/]+)\//)?.[1],
    targetFeature: target.match(/^src\/features\/([^/]+)(?:\/|$)/)?.[1],
  };
}

function expressionName(expression: compiler.Expression) {
  if (compiler.isIdentifier(expression)) {
    return expression.text;
  }

  if (compiler.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  if (
    compiler.isElementAccessExpression(expression) &&
    compiler.isStringLiteral(expression.argumentExpression)
  ) {
    return expression.argumentExpression.text;
  }

  return undefined;
}

function makesRequest(node: compiler.Node): boolean {
  if (
    (compiler.isCallExpression(node) || compiler.isNewExpression(node)) &&
    ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].includes(
      expressionName(node.expression) ?? '',
    )
  ) {
    return true;
  }

  return compiler.forEachChild(node, makesRequest) ?? false;
}

export function inspectImports(
  file: string,
  source: string,
  options: compiler.CompilerOptions = {},
): string[] {
  const path = file.replaceAll('\\', '/');
  const violations = compiler
    .preProcessFile(source, true, true)
    .importedFiles.flatMap((imported) => {
      const context = contextFor(path, imported.fileName, options);

      return Object.entries(importRules)
        .filter(([_rule, violates]) => violates(context))
        .map(([rule]) => rule);
    });
  const syntax = compiler.createSourceFile(path, source, compiler.ScriptTarget.Latest, true);

  if (path.startsWith('src/shared/ui/') && makesRequest(syntax)) {
    violations.push('C-4');
  }

  return [...new Set(violations)];
}
