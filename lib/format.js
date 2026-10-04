import chalk from 'chalk';

export function printHuman(findings) {
  for (const item of findings) {
    const icon = item.level === 'pass' ? chalk.green('✔') : item.level === 'fail' ? chalk.red('✖') : chalk.yellow('⚠');
    console.log(`${icon} ${item.message}`);
    if (item.hint) console.log(chalk.dim(`  → ${item.hint}`));
  }
}

export function summarize(findings) {
  const fail = findings.filter((f) => f.level === 'fail').length;
  const warn = findings.filter((f) => f.level === 'warn').length;
  const pass = findings.filter((f) => f.level === 'pass').length;
  return { pass, warn, fail, ok: fail === 0 };
}
