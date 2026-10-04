# switch-framework-doctor

CLI that checks whether **Switch Framework** and the Switch npm components in a project can work together.

[Switch Framework](https://github.com/Switcherfaiz/switch-framework) is a no-build frontend runtime: screens, layouts, state, and custom elements served as native ESM. Apps also install `switch-framework-backend` (import map + `/npm` allowlist) and may import third-party Switch components (`peerDependencies.switch-framework`).

**Doctor is the health check for that graph.** It is the Expo Doctor equivalent for Switch: one command that reads the app (or the `switch-framework` package itself), compares installed versions, and reports peer mismatches before the browser hits a blank screen.

It ships as its own package so it can be a **dependency of `switch-framework`**. Installing the framework also installs the CLI. You still run it from the project you want checked — the framework package, or an app that depends on it.

## What it is used for

- Confirm `switch-framework` is installed and readable
- Confirm `switch-framework-backend` is on the same major.minor line
- Confirm Node is 18+
- Confirm every name in `switchFramework.imports` is installed
- Confirm each allowlisted package’s `peerDependencies.switch-framework` **satisfies** the installed framework version
- Fail packages that nest `switch-framework` under `dependencies` (two state stores)
- Optionally apply **safe** fixes (`--fix`): missing installs and first-party version alignment — never auto-edit the allowlist

It does **not** scaffold an app (that is `create-switch-framework-app`) and it does **not** serve the browser (that is `switch-framework-backend`).

## Install

Inside **switch-framework** (so the runtime and the doctor stay on one version line):

```json
{
  "dependencies": {
    "switch-framework-doctor": "^0.3.0"
  },
  "scripts": {
    "doctor": "switch-doctor"
  }
}
```

In an app, you usually get it transitively from `switch-framework`. You can also add it directly:

```bash
npm i -D switch-framework-doctor
npx switch-doctor
```

Or run without installing:

```bash
npx switch-doctor
npx switch-framework-doctor
```

## Commands

```bash
switch-doctor
switch-doctor check
switch-doctor --json
switch-doctor --fix
switch-doctor --cwd /path/to/app
switch-doctor -h
```

`check` is the default. `--json` is for CI (exit `1` when any check fails). `--fix` only installs missing allowlisted packages and first-party alignment; peer mismatches print a hint and stay manual.

## Example

```
✔ Project framework-test (app)
✔ Node 22.17.1
✔ switch-framework@0.3.0
✔ switch-framework-backend@0.3.0 matches 0.3
✔ @faiz/tw-masonry@0.1.0 peer switch-framework@>=0.3.0 satisfies 0.3.0
```

## Related

- [switch-framework](https://github.com/Switcherfaiz/switch-framework)
- [switch-framework-backend](https://github.com/Switcherfaiz/switch-framework-backend)
- [create-switch-framework-app](https://github.com/Switcherfaiz/create-switch-framework-app)

MIT — same license as the rest of Switch Framework.
