import {ESLint} from 'eslint';
import getTscLintingConfig from 'eslint-config-techsmith';
import importPlugin from 'eslint-plugin-import';

export default [
  ...getTscLintingConfig(
    ['**/node_modules/', '**/data/', '**/build/'],
    {
      process: false
    }
  ),
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script'
      // parserOptions: {
      //   project: "./tsconfig.json",
      // },
    },
    plugins: {
      import: importPlugin
    }
  },
  {
    rules: {
      'no-nested-ternary': 'off',
      'no-console': 'warn',
      indent: 'off',
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1
      }],
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      strict: 'off',
      'no-nested-ternary': 'off',
      'no-console': 'warn',
      indent: 'off',
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        FunctionDeclaration: {
          parameters: 'first'
        },
        FunctionExpression: {
          parameters: 'first'
        }
      }],
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  } as ESLint.ConfigData,
  {
    files: ['**/*.mjs', '**/*.mts'],
    languageOptions: {
      sourceType: 'module'
    }
  }
];
