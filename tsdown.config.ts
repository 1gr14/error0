import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  outDir: 'dist',
  format: 'esm',
  unbundle: true,
  dts: true,
  sourcemap: false,
  clean: true,
  platform: 'node',
  target: 'es2022',
  tsconfig: './tsconfig.build.json',
  // `@point0/*` is a devDep only (the point0-redirect plugin is point0-specific and optional), so tsdown would
  // otherwise *bundle* a frozen copy of point0's runtime into our dist. Keep it external: the consuming point0 app
  // supplies its own @point0/core at runtime.
  external: ['bun:test', /^@point0\//],
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
})
