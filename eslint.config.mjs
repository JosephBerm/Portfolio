import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Override default ignores of eslint-config-next. Flat config doesn't read .gitignore, so Claude Code
	// worktrees (full copies of src/ in .claude/worktrees/) are listed here too.
	globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.claude/worktrees/**']),
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
])

export default eslintConfig
