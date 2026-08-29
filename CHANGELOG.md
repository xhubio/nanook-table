## [3.0.1](https://github.com/xhubio/nanook-table/compare/v3.0.0...v3.0.1) (2026-08-29)


### Bug Fixes

* **processor:** the documented specification marker reaches its parser ([87c7da9](https://github.com/xhubio/nanook-table/commit/87c7da9f2aff3ea8ffcb489f9292c201b508ded8))

# [3.0.0](https://github.com/xhubio/nanook-table/compare/v2.1.5...v3.0.0) (2026-08-18)


### Tests

* **processor:** pin what a dangling reference actually does ([430bf84](https://github.com/xhubio/nanook-table/commit/430bf845f628b165ebb945071eb5dedc07380403))


### BREAKING CHANGES

* **processor:** for every consumer relying on best-effort generation, so that is a
decision and not a fix. This test is now where the decision becomes visible.

What it does assert is the contract that matters: the logger is not optional.
`TestcaseProcessor` defaults to a fresh `LoggerMemory()` the caller never sees; a
consumer that does not pass its own and inspect `logger.entries.error` afterwards has
discarded the only signal there is.

Mutation-probed: pointing the reference at a table that does exist turns the test red,
so it measures what it claims to. The fixture is built in the test rather than
committed as a binary — the sheet contents are then readable as an array.

Full chain green: 48 files, 201 tests.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Cv8sa3iQgSwsxjv9iRPe7R

## [2.1.5](https://github.com/xhubio/nanook-table/compare/v2.1.4...v2.1.5) (2026-08-16)


### Bug Fixes

* **matrix:** ein statischer Wert wurde verworfen, ein fehlender wurde zu Muell ([25b417c](https://github.com/xhubio/nanook-table/commit/25b417c526ff766427242e4e72fa0c7e7f9ea9a1))

## [2.1.4](https://github.com/xhubio/nanook-table/compare/v2.1.3...v2.1.4) (2026-08-15)


### Bug Fixes

* honour the required 'tables' option in the constructor ([8872619](https://github.com/xhubio/nanook-table/commit/88726193c7862e35ed61990ab14da142e9d9fd7b))

## [2.1.3](https://github.com/xhubio/nanook-table/compare/v2.1.2...v2.1.3) (2026-08-15)


### Bug Fixes

* declare the repository so provenance can be verified ([90bc948](https://github.com/xhubio/nanook-table/commit/90bc94856706d71b3a8919c5e7bb76cbe5cbcdc4))

## [2.1.2](https://github.com/xhubio/nanook-table/compare/v2.1.1...v2.1.2) (2026-08-15)


### Bug Fixes

* resolve a self reference inside a referenced table ([3df6194](https://github.com/xhubio/nanook-table/commit/3df6194a8f9c10fda5f88c6475b782166e2957ed))

## [2.1.1](https://github.com/xhubio/nanook-table/compare/v2.1.0...v2.1.1) (2026-03-29)


### Bug Fixes

* add more claude stuff ([f5e2ea2](https://github.com/xhubio/nanook-table/commit/f5e2ea23864a00d14b060e2fe5afd28a2115e93f))

# [2.1.0](https://github.com/xhubio/nanook-table/compare/v2.0.0...v2.1.0) (2026-03-29)


### Features

* add a skill and commnd for claude ([b017778](https://github.com/xhubio/nanook-table/commit/b01777883a47fef318eff324ff353abced14c3e4))

# [2.0.0](https://github.com/xhubio/nanook-table/compare/v1.1.7...v2.0.0) (2026-03-07)


* feat!: rewrite to TypeScript with pnpm, vitest and modern tooling ([4367766](https://github.com/xhubio/nanook-table/commit/4367766daba469c8485391374e02fb550d5f002b))


### Bug Fixes

* fixes all the tests ([c7ec1f1](https://github.com/xhubio/nanook-table/commit/c7ec1f126870c8c84ca698264acd563debd2a109))
* upgrade dependencies ([9134a89](https://github.com/xhubio/nanook-table/commit/9134a89857522d5e6d38e80e2e66b29051b41f85))
* upgrade dependencies ([ce83eb9](https://github.com/xhubio/nanook-table/commit/ce83eb99f62406c7ddb8f1408f223c9103e5a861))


### BREAKING CHANGES

* Package is now ESM-only TypeScript. All imports changed from
CommonJS to ESM. Minimum Node.js version is now 22.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
