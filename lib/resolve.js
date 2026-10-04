import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export function requireFrom(root) {
  return createRequire(path.join(root, 'package.json'));
}

export function readInstalled(name, root) {
  const req = requireFrom(root);
  try {
    const pkgPath = req.resolve(`${name}/package.json`);
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    try {
      const entry = req.resolve(name);
      let dir = path.dirname(entry);
      while (true) {
        const candidate = path.join(dir, 'package.json');
        if (fs.existsSync(candidate)) {
          const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'));
          if (pkg?.name) return pkg;
        }
        const parent = path.dirname(dir);
        if (parent === dir) return null;
        dir = parent;
      }
    } catch {
      return null;
    }
  }
}

export function listedImportNames(value) {
  if (Array.isArray(value)) {
    return value.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim());
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).filter((name) => {
      const entry = value[name];
      return entry === true || typeof entry === 'string';
    });
  }
  return [];
}

export function tryBackendImports(root) {
  try {
    const req = requireFrom(root);
    return req('switch-framework-backend/imports.js');
  } catch {
    return null;
  }
}
