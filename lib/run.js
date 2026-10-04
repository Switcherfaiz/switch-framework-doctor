import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import { findAppRoot } from './appRoot.js';
import { listedImportNames, readInstalled, tryBackendImports } from './resolve.js';
import { printHuman, summarize } from './format.js';

function add(findings, level, id, message, extra = {}) {
  findings.push({ level, id, message, ...extra });
}

function majorMinor(version) {
  const parsed = semver.parse(semver.coerce(version));
  if (!parsed) return null;
  return `${parsed.major}.${parsed.minor}`;
}

function npmInstall(root, spec, dry) {
  const args = ['install', spec, '--no-fund', '--no-audit'];
  if (dry) return { ok: true, command: `npm ${args.join(' ')}` };
  const result = spawnSync('npm', args, { cwd: root, stdio: 'inherit', shell: true });
  return { ok: result.status === 0, command: `npm ${args.join(' ')}` };
}

export async function runDoctor({ cwd, json = false, fix = false } = {}) {
  const found = findAppRoot(cwd);
  const findings = [];

  if (!found) {
    add(findings, 'fail', 'app-root', 'No package.json found. Run npx switch-framework-doctor from a Switch app.');
    return finish(findings, json, { root: null, kind: null });
  }

  const { root, pkg, kind } = found;
  add(findings, 'pass', 'app-root', `Project ${pkg.name || root} (${kind})`);

  const nodeOk = semver.satisfies(process.versions.node, '>=18');
  if (nodeOk) add(findings, 'pass', 'node', `Node ${process.versions.node}`);
  else add(findings, 'fail', 'node', `Node ${process.versions.node} is below 18`, { hint: 'Install Node 18 or newer' });

  const framework = kind === 'framework' ? pkg : readInstalled('switch-framework', root);
  if (!framework) {
    add(findings, 'fail', 'switch-framework', 'switch-framework is not installed', {
      hint: 'npm i switch-framework',
      fixSpec: 'switch-framework@^0.3.0'
    });
  } else {
    add(findings, 'pass', 'switch-framework', `switch-framework@${framework.version}`);
  }

  const installedVersion = framework?.version || null;
  const backend = readInstalled('switch-framework-backend', root);
  if (backend && installedVersion) {
    const fwLine = majorMinor(installedVersion);
    const beLine = majorMinor(backend.version);
    if (fwLine && beLine && fwLine === beLine) {
      add(findings, 'pass', 'backend', `switch-framework-backend@${backend.version} matches ${fwLine}`);
    } else {
      add(findings, 'fail', 'backend', `switch-framework-backend@${backend.version} does not match switch-framework@${installedVersion}`, {
        hint: `npm i switch-framework-backend@${fwLine || installedVersion}`,
        fixSpec: fwLine ? `switch-framework-backend@${fwLine}` : null
      });
    }
  } else if (kind === 'app') {
    add(findings, 'warn', 'backend', 'switch-framework-backend is not installed (ok if this is not the app server)');
  }

  const listed = listedImportNames(pkg.switchFramework?.imports);
  const backendApi = tryBackendImports(root);
  if (backendApi?.buildImportPlan && listed.length) {
    try {
      const plan = backendApi.buildImportPlan(root);
      add(findings, 'pass', 'import-plan', `Import map allowlist: ${[...plan.allowlist.keys()].join(', ') || '(empty extra packages)'}`);
    } catch (err) {
      add(findings, 'fail', 'import-plan', err.message || 'buildImportPlan failed');
    }
  }

  for (const name of listed) {
    const installed = readInstalled(name, root);
    if (!installed) {
      add(findings, 'fail', `import:${name}`, `${name} is listed in switchFramework.imports but not installed`, {
        hint: `npm i ${name}`,
        fixSpec: name
      });
      continue;
    }

    const peer = installed.peerDependencies?.['switch-framework'];
    if (peer && installedVersion) {
      if (semver.satisfies(installedVersion, peer)) {
        add(findings, 'pass', `peer:${name}`, `${name}@${installed.version} peer switch-framework@${peer} satisfies ${installedVersion}`);
      } else {
        add(findings, 'fail', `peer:${name}`, `${name}@${installed.version} peer switch-framework@${peer} does not satisfy ${installedVersion}`, {
          hint: `npm i ${name}@latest   or   change switch-framework so it matches ${peer}`
        });
      }
    } else if ((installed.keywords || []).includes('switch-component')) {
      add(findings, 'warn', `peer:${name}`, `${name} looks like a Switch component but has no peerDependencies.switch-framework`);
    } else {
      add(findings, 'warn', `peer:${name}`, `${name} has no Switch peer (plain helper — ok)`);
    }

    if (installed.dependencies?.['switch-framework']) {
      add(findings, 'fail', `nested-dep:${name}`, `${name} depends on switch-framework instead of peerDependencies — two state stores`, {
        hint: 'Ask the package author to move switch-framework to peerDependencies'
      });
    }

    const nestedCopy = path.join(root, 'node_modules', name, 'node_modules', 'switch-framework', 'package.json');
    if (fs.existsSync(nestedCopy)) {
      add(findings, 'fail', `nested-copy:${name}`, `${name} has a nested node_modules/switch-framework`, {
        hint: 'npm dedupe   and use peerDependencies'
      });
    }
  }

  if (fix) {
    const unique = [...new Set(
      findings
        .filter((f) => f.level === 'fail' && f.fixSpec)
        .filter((f) => f.id === 'switch-framework' || f.id === 'backend' || String(f.id).startsWith('import:'))
        .map((f) => f.fixSpec)
    )];
    for (const spec of unique) {
      const applied = npmInstall(root, spec, false);
      add(findings, applied.ok ? 'pass' : 'fail', `fix:${spec}`, applied.ok ? `Fixed with ${applied.command}` : `Could not run ${applied.command}`);
    }
    if (!unique.length) add(findings, 'pass', 'fix', 'No safe automatic fixes. Peer mismatches need a version you choose.');
  }

  return finish(findings, json, { root, kind, name: pkg.name, framework: installedVersion });
}

function finish(findings, json, meta) {
  const summary = summarize(findings);
  const result = { ...meta, ...summary, findings };
  if (!json) {
    printHuman(findings);
    if (!summary.ok) process.exitCode = 1;
  }
  return result;
}
