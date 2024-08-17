import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/node_modules/", "**/data/", "**/build/"],
}, ...compat.extends("techsmith/es6", "techsmith/react"), {
    languageOptions: {
        globals: {
            process: "readonly",
        },

        ecmaVersion: 2020,
        sourceType: "script",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    rules: {
        "no-nested-ternary": "off",
        "no-console": "warn",

        indent: ["error", 2, {
            SwitchCase: 1,
        }],
    },
}, ...compat.extends("techsmith/ts", "techsmith/react-ts").map(config => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
})), {
    files: ["**/*.ts", "**/*.tsx"],

    rules: {
        "no-nested-ternary": "off",
        indent: "off",
        "no-console": "warn",
        "@typescript-eslint/no-non-null-assertion": "off",

        "@typescript-eslint/indent": ["error", 2, {
            SwitchCase: 1,

            FunctionDeclaration: {
                parameters: "first",
            },

            FunctionExpression: {
                parameters: "first",
            },
        }],
    },
}];