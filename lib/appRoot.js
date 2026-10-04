import fs from 'node:fs';
import path from 'node:path';

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function isSwitchProject(pkg) {
  if (!pkg || typeof pkg !== 'object') return false;
  if (pkg.name === 'switch-framework') return true;
  if (pkg.switchFramework) return true;
  const bags = [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies];
  return bags.some((bag) => bag && bag['switch-framework']);
}

export function findAppRoot(startDir) {
  let dir = path.resolve(startDir || process.cwd());
  let fallback = null;

  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = readJson(pkgPath);
      if (isSwitchProject(pkg)) {
        return { root: dir, pkg, pkgPath, kind: pkg.name === 'switch-framework' ? 'framework' : 'app' };
      }
      if (!fallback && pkg) fallback = { root: dir, pkg, pkgPath, kind: 'unknown' };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return fallback;
}

export { readJson };
