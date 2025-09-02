import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'sort-imports': ['off'],
    },
  },
  {
    ignores: [],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': ['error', {
        'groups': ['builtin','external','internal','parent','sibling','index','object','type'],
        'pathGroups': [
          { 'pattern': '@components/**', 'group': 'internal', 'position': 'before' },
          { 'pattern': '@assets/**', 'group': 'internal', 'position': 'after' },
          { 'pattern': '@styles/**', 'group': 'internal', 'position': 'after' },
          { 'pattern': '@utils/**', 'group': 'internal', 'position': 'after' },
          { 'pattern': '@types/**', 'group': 'internal', 'position': 'after' },
          { 'pattern': '@hooks/**', 'group': 'internal', 'position': 'after' },
          { 'pattern': '@services/**', 'group': 'internal', 'position': 'after' }
        ],
        'pathGroupsExcludedImportTypes': ['builtin'],
        'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
      }]
    }
  }
])
