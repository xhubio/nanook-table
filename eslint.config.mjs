import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsdoc from 'eslint-plugin-tsdoc'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  {
    ignores: [
      'dist/**/*',
      '**/node_modules/**/*',
      'coverage/**/*',
      'tests/fixtures/**/*',
      'tests/volatile/**/*',
      'tests/**/fixtures/**/*',
      'tests/**/volatile/**/*'
    ],
    rules: {
      'prefer-template': 'error',
      semi: [2, 'always'],
      eqeqeq: 'error',
      'max-params': ['error', 3],
      'no-else-return': 'error',
      'spaced-comment': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ':matches(ImportNamespaceSpecifier, ExportAllDeclaration, ExportNamespaceSpecifier)',
          message: 'Import/export only modules you need'
        }
      ],
      'no-console': 'warn',
      'no-debugger': 'warn',
      'tsdoc/syntax': 'warn',
      'object-shorthand': 'error',
      'require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'none',
            requireLast: false
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false
          },
          multilineDetection: 'brackets'
        }
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['class', 'interface'],
          format: ['PascalCase']
        },
        {
          selector: ['function', 'classMethod', 'classProperty'],
          format: ['camelCase']
        },
        {
          selector: ['classProperty'],
          modifiers: ['static'],
          format: ['camelCase', 'UPPER_CASE']
        },
        {
          selector: ['parameter'],
          format: ['camelCase']
        },
        {
          selector: ['typeProperty'],
          format: ['camelCase']
        },
        {
          selector: ['enumMember'],
          format: ['camelCase', 'UPPER_CASE']
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE']
        },
        {
          selector: ['variable'],
          modifiers: ['exported'],
          format: ['PascalCase', 'camelCase', 'UPPER_CASE']
        }
      ]
    }
  },
  ...compat.extends('plugin:@typescript-eslint/strict', 'prettier'),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      tsdoc
    },

    languageOptions: {
      globals: {
        ...globals.node
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.json'
      }
    }
  }
]
