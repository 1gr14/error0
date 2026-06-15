#!/usr/bin/env bun
/**
 * check-channel — enforce the branch ↔ version invariant so a prerelease can never publish as stable (and vice-versa):
 *
 * next → version MUST be a prerelease x.y.z-next.N (dist-tag: next) main → version MUST be stable x.y.z (dist-tag:
 * latest)
 *
 * Run in CI before publishing and in the local pre-push hook. Branches other than main/next are unconstrained (dev etc.
 * never publish). `assertChannel` throws on mismatch; the CLI exits 1.
 *
 * bun run check:channel # branch from GITHUB_REF_NAME (CI) or current git branch bun run check:channel next # explicit
 * branch
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const isPrerelease = (version: string): boolean => version.includes('-')

/** The release channel a version belongs to: prerelease → 'next', stable → 'main'. */
export const channelFor = (version: string): 'next' | 'main' => (isPrerelease(version) ? 'next' : 'main')

/** Throw if `version` may not publish from `branch`. Non-release branches are allowed through. */
export function assertChannel(version: string, branch: string): void {
  if (branch !== 'main' && branch !== 'next') return // only main/next are release branches
  const expected = channelFor(version)
  if (branch === expected) return
  throw new Error(
    branch === 'main'
      ? `Channel guard: main publishes STABLE only, but the version is "${version}" (a prerelease). ` +
          'A -next build must never reach main/latest. Run `bun run release stable` first.'
      : `Channel guard: next publishes PRERELEASES only (x.y.z-next.N), but the version is "${version}" (stable). ` +
          'Run `bun run release prerelease` first.',
  )
}

export const pkgVersion = (): string =>
  (JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8')) as { version: string }).version

if (import.meta.main) {
  const currentBranch = () =>
    Bun.spawnSync(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd: rootDir }).stdout.toString().trim()
  const branch = process.argv[2] || process.env.GITHUB_REF_NAME || currentBranch()
  const version = pkgVersion()
  try {
    assertChannel(version, branch)
    console.info(`channel OK: ${branch} ↔ ${version}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
