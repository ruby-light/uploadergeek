const {defineConfig, globalIgnores} = require('eslint/config');
const tsParser = require('@typescript-eslint/parser');
const {fixupConfigRules} = require('@eslint/compat');
const js = require('@eslint/js');
const {FlatCompat} = require('@eslint/eslintrc');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([
    {
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2018,
            sourceType: 'module',

            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },

                project: './frontend/tsconfig.json',
                tsconfigRootDir: __dirname
            }
        },
        extends: fixupConfigRules(compat.extends('plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:@typescript-eslint/recommended')),

        settings: {
            react: {
                version: 'detect'
            }
        },

        rules: {
            'react/display-name': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error'
        }
    },
    {
        files: ['**/*.tsx', '**/*.ts'],

        rules: {
            'no-inline-comments': 'warn',
            'no-warning-comments': 'warn',
            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                    children: 'ignore'
                }
            ],

            curly: ['error', 'all'],
            'react/no-children-prop': 'off',
            'react/prop-types': 'off',

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],

            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            'prefer-spread': 'off',
            'react/react-in-jsx-scope': 'off',

            '@typescript-eslint/array-type': [
                'warn',
                {
                    default: 'generic'
                }
            ],

            '@typescript-eslint/await-thenable': 'error'
        }
    },
    globalIgnores(['bin', '**/node_modules', 'src/declarations', 'release/frontend', '**/eslint.config.cjs', '**/jest.polyfill.js', '**/jest.project.ts', '**/jest.config.ts', '**/vite.config.js'])
]);
