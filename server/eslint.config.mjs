import getTscLintingConfig from "eslint-config-techsmith";

export default [
  ...getTscLintingConfig(
    ['**/node_modules/', '**/data/', '**/build/'],
    {
      process: "readonly",
    },
  ),
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      // parserOptions: {
      //   project: "./tsconfig.json",
      // },
    },
  },
  {
    rules: {
      "no-nested-ternary": "off",
      "no-console": "warn",
      indent: "off",
      "@stylistic/indent": ["error", 2, {
        SwitchCase: 1,
      }],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      strict: "off",
      "no-nested-ternary": "off",
      "no-console": "warn",
      indent: "off",
      "@stylistic/indent": ["error", 2, {
        SwitchCase: 1,
        FunctionDeclaration: {
          parameters: "first",
        },
        FunctionExpression: {
          parameters: "first",
        },
      }],
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
