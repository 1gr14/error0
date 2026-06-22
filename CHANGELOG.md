# Changelog

All notable changes to `@1gr14/error0`. Add notes under **Unreleased** as you
work; `bun run release` promotes that section to the new version.

## Unreleased

## 0.4.3 — 2026-06-22

## 0.4.2 — 2026-06-15

- Maintenance: release tooling moved from semantic-release to in-house scripts
  (`bun run release` + an idempotent OIDC publish in CI). No library or API
  changes.

## 0.4.1 — 2026-06-15

### Bug Fixes

- split causePlugin from an experimental causeVariantsPlugin
  ([7d5a100](https://github.com/1gr14/error0/commit/7d5a100c60dac0ea51474036c724c89c468a7a70))
- stop serializing an Error0's own name
  ([48e00a0](https://github.com/1gr14/error0/commit/48e00a0300f1ef8d7ea14636fb56c5eee7bf57ee))

## 0.4.0 — 2026-06-11

### Features

- stackPlugin — the default stack gate as a plugin, transport-switchable
  ([9849595](https://github.com/1gr14/error0/commit/98495954c4de4914f73782435cbf072e53ecd773))

## 0.3.0 — 2026-06-11

### Features

- named serialization audiences, transport plugin option, foreign-cause chains
  ([8e74e98](https://github.com/1gr14/error0/commit/8e74e98d926ef6fee357a3c165ad9d1dbbe75d0d))

## 0.2.0 — 2026-06-10

### Features

- add codeStatusPlugin — code and status in one plugin, status auto-filled from
  a code → status map
  ([85a6b87](https://github.com/1gr14/error0/commit/85a6b87512104f850e5756e9e31f43492901d886))

## 0.1.0 — 2026-06-08

### Features

- rebrand to `@1gr14/error0`
  ([e4d7378](https://github.com/1gr14/error0/commit/e4d7378d48ca2994e321ba76b500109e09b840bd))
