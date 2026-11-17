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
	{
		// The landing scene's art is a chunk of its own that miamiRuntime.ts loads with import() as the page's end comes near: a
		// value import of it from the worker's other files would put it back in the worker's first download. The art's own files
		// import each other freely; the rule doesn't see import(), and type-only imports leave nothing in the output. A new file
		// that only the art reaches joins both lists, `ignores` and the pattern, or a value import of it would pass unseen.
		files: ['src/components/sky/**/*.ts', 'src/lib/sky/**/*.ts'],
		ignores: [
			'src/components/sky/miamiArt.ts',
			'src/components/sky/miamiAssets.ts',
			'src/components/sky/renderMiami.ts',
			'src/components/sky/miamiPalmArt.ts',
			'src/lib/sky/miamiWater.ts',
			'src/lib/sky/miamiWind.ts',
			'src/lib/sky/miamiSkyline.ts',
		],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '(^|/)(miamiArt|miamiAssets|renderMiami|miamiPalmArt|miamiWater|miamiWind|miamiSkyline)$',
							allowTypeImports: true,
							message: "The landing scene's art loads as a chunk of its own: import it for types only, and reach it through MiamiArt.",
						},
					],
				},
			],
		},
	},
])

export default eslintConfig
