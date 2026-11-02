const fs = require('fs');
const path = require('path');
const babelParser = require(path.join(__dirname, '..', '..', 'veda-frontend', 'node_modules', '@babel', 'parser'));
const builtinModules = new Set(require('module').builtinModules);

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (/\.(js|cjs|mjs)$/.test(file)) {
      results.push(filePath);
    }
  }
  return results;
}

const backendDir = path.join(__dirname, '..');
const srcFiles = walk(path.join(backendDir, 'src'));
const rootFiles = fs.readdirSync(backendDir)
  .filter(f => /\.(js|cjs|mjs)$/.test(f))
  .map(f => path.join(backendDir, f));

const allFiles = [...srcFiles, ...rootFiles];
const requires = new Map();

function traverseAST(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) traverseAST(c, visitor);
    } else if (child && typeof child === 'object' && child.type) {
      traverseAST(child, visitor);
    }
  }
}

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = babelParser.parse(content, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'classProperties', 'objectRestSpread', 'dynamicImport'],
    });
  } catch (err) {
    console.warn(`Could not parse ${file}: ${err.message}`);
    continue;
  }

  traverseAST(ast, (node) => {
    // 1. require('...')
    if (
      node.type === 'CallExpression' &&
      node.callee &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'require' &&
      node.arguments.length > 0 &&
      node.arguments[0].type === 'StringLiteral'
    ) {
      record(node.arguments[0].value, file);
    }

    // 2. import ... from '...' or import '...'
    if (node.type === 'ImportDeclaration' && node.source && node.source.value) {
      record(node.source.value, file);
    }

    // 3. import('...')
    if (
      (node.type === 'CallExpression' && node.callee && node.callee.type === 'Import') ||
      node.type === 'ImportExpression'
    ) {
      const arg = node.arguments ? node.arguments[0] : node.source;
      if (arg && arg.type === 'StringLiteral') {
        record(arg.value, file);
      }
    }
  });
}

function record(modPath, file) {
  if (modPath.startsWith('.') || modPath.startsWith('/') || modPath.startsWith('\\')) return;
  if (modPath.startsWith('node:')) return;
  
  let pkgName = modPath;
  if (modPath.startsWith('@')) {
    const parts = modPath.split('/');
    pkgName = parts.slice(0, 2).join('/');
  } else {
    pkgName = modPath.split('/')[0];
  }
  
  if (builtinModules.has(pkgName)) return;

  if (!requires.has(pkgName)) {
    requires.set(pkgName, new Set());
  }
  requires.get(pkgName).add(file);
}

const pkgJson = JSON.parse(fs.readFileSync(path.join(backendDir, 'package.json'), 'utf8'));
const declaredDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };

console.log('=== EXACT AUDIT OF EXTERNAL DEPENDENCIES (AST PARSED) ===\n');
const missingInNodeModules = [];
const missingInPackageJson = [];

for (const [pkg, usedIn] of requires.entries()) {
  let resolved = false;
  try {
    require.resolve(pkg, { paths: [backendDir] });
    resolved = true;
  } catch (e) {
    resolved = false;
  }

  const inPkgJson = !!declaredDeps[pkg];
  const relativeFiles = Array.from(usedIn).map(f => path.relative(backendDir, f));
  console.log(`Package: ${pkg.padEnd(25)} | in package.json: ${inPkgJson ? 'YES' : 'NO '} | in node_modules: ${resolved ? 'YES' : 'NO '} | used in: ${relativeFiles.length} file(s)`);
  if (!resolved) missingInNodeModules.push({ pkg, files: relativeFiles });
  if (!inPkgJson) missingInPackageJson.push({ pkg, files: relativeFiles });
}

console.log('\n=== GENUINELY MISSING IN NODE_MODULES ===');
console.log(JSON.stringify(missingInNodeModules, null, 2));

console.log('\n=== GENUINELY MISSING IN PACKAGE.JSON ===');
console.log(JSON.stringify(missingInPackageJson, null, 2));
