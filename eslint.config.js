// ESLint flat config using eslint-config-love
import love from 'eslint-config-love'
import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import noOnlyTests from 'eslint-plugin-no-only-tests'

export default defineConfig([
  // Global ignores to keep linting fast and avoid vendor/build dirs
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-npm/**',
      '**/.cache/**',
      '**/.husky/**',
      '**/.git/**',
      '**/templates/**',
      'tsdown.config.ts',
      'eslint.config.js',
      '.commitlintrc.js',
    ],
  },
  {
    ...love,
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    rules: {
      ...(love.rules ?? {}),
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [{ from: 'package', name: 'Error0', package: '@devp0nt/error0' }],
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],

      // disable
      'max-lines': 'off',
      'no-lonely-if': 'off',
      'no-negated-condition': 'off',
      'no-param-reassign': 'off',
      'arrow-body-style': 'off',
      'promise/avoid-new': 'off',
      complexity: 'off',
      'no-plusplus': 'off',
      'max-nested-callbacks': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',

      // TODO: try to remove this disables
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'eslint-comments/require-description': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}'],
    plugins: {
      'no-only-tests': noOnlyTests,
    },
    rules: {
      'no-only-tests/no-only-tests': 'error',
    },
  },
  prettier,
])
