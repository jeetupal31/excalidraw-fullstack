import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // DX/HMR-only rule (Fast Refresh); irrelevant to production correctness.
      // Contexts intentionally co-locate their provider component and hook.
      'react-refresh/only-export-components': 'warn',
      // Perf-hint rule (react-hooks v7). The setState-in-effect usages here are
      // legitimate "reset state when an input changes" patterns, not bugs.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
