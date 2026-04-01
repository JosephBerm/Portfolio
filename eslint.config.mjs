import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
	baseDirectory: __dirname,
})

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	{
		ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',

			// Ban wildcard / namespace imports (e.g. `import * as Foo from '...'`).
			// Named imports are easier to tree-shake and make dependencies explicit.
			'no-restricted-syntax': [
				'error',
				{
					selector: 'ImportNamespaceSpecifier',
					message:
						'Wildcard imports are not allowed. Use named imports instead (e.g. `import { Foo } from "..."`).',
				},
			],
		},
	},
]

export default eslintConfig
