<p align="center">
  <img src="https://raw.githubusercontent.com/Switcherfaiz/switch-framework-doctor/master/logo.svg" alt="Switch Framework" width="180" />
</p>

# switch-framework-doctor

CLI that checks whether **Switch Framework** and the Switch npm components in a project can work together.

[Switch Framework](https://github.com/Switcherfaiz/switch-framework) is a no-build frontend runtime: screens, layouts, state, and custom elements served as native ESM. Apps also install `switch-framework-backend` (import map + `/npm` allowlist) and may import third-party Switch components (`peerDependencies.switch-framework`).

**Doctor is the health check for that graph.** It is the Expo Doctor equivalent for Switch: one command that reads your **app**, compares installed versions, and reports peer mismatches before the browser hits a blank screen.

It is **not** part of the `switch-framework` runtime package. Users add it to an app themselves, or accept it when `create-switch-framework-app` asks during scaffold.

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

From the create-app CLI (it will ask):

```bash
npx create-switch-framework-app my-app
# Also install switch-framework-doctor? (npx switch-framework-doctor)
```

Or add it to an existing Switch app:

```bash
npm i -D switch-framework-doctor
```

```json
{
  "scripts": {
    "doctor": "switch-framework-doctor"
  }
}
```

Then:

```bash
npx switch-framework-doctor
```

You can also run it without a project dependency:

```bash
npx switch-framework-doctor
```

## Commands

```bash
npx switch-framework-doctor
npx switch-framework-doctor check
npx switch-framework-doctor --json
npx switch-framework-doctor --fix
npx switch-framework-doctor --cwd /path/to/app
npx switch-framework-doctor -h
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
- [switch-framework-icons](https://github.com/Switcherfaiz/switch-framework-icons)
- [switch-framework-router](https://github.com/Switcherfaiz/switch-framework-router)
- [create-switch-framework-app](https://github.com/Switcherfaiz/create-switch-framework-app)

MIT — same license as the rest of Switch Framework.
