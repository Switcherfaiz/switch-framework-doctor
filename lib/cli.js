import chalk from 'chalk';
import { runDoctor } from './run.js';

export function printHelp() {
  console.log(`
${chalk.bold('switch-framework-doctor')}
Check that Switch Framework and Switch npm components can work together.

Usage:
  npx switch-framework-doctor [check] [options]
  switch-framework-doctor [check] [options]

Commands:
  check             Run health checks (default)

Options:
  --json            Print machine-readable results
  --fix             Apply safe first-party / missing-install fixes
  --cwd <dir>       App or switch-framework package root (default: cwd)
  -h, --help        Show help
`);
}

export function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('-')));
  const help = flags.has('-h') || flags.has('--help');
  const json = flags.has('--json');
  const fix = flags.has('--fix');

  const getValue = (name) => {
    const i = args.indexOf(name);
    if (i === -1) return null;
    const v = args[i + 1];
    if (!v || v.startsWith('-')) return null;
    return v;
  };

  const cwd = getValue('--cwd');
  const positional = args.filter((a) => !a.startsWith('-') && a !== getValue('--cwd'));
  const command = positional[0] || 'check';

  return { help, json, fix, cwd, command };
}

export async function runCli(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    printHelp();
    return;
  }
  if (opts.command !== 'check') {
    console.error(`Unknown command "${opts.command}". Try --help.`);
    process.exitCode = 1;
    return;
  }
  const result = await runDoctor({
    cwd: opts.cwd || process.cwd(),
    json: opts.json,
    fix: opts.fix
  });
  if (!opts.json) return;
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.ok === false) process.exitCode = 1;
}
