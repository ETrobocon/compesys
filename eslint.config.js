import globals from 'globals';
import tseslint from 'typescript-eslint';

import eslint from '@eslint/js';
import typescriptEslintParser from '@typescript-eslint/parser';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/opt/**'] },
  { rules: { 'no-console': 'off' } },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    ignores: ['**/__tests__/**'],
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parser: typescriptEslintParser,
      parserOptions: {
        allowAutomaticSingleRunInference: true,
        ecmaVersion: 2022,
        jsDocParsingMode: 'all',
        lib: ['es2023'],
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/__tests__/**/*.test.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.jest,
      },
      parser: typescriptEslintParser,
      parserOptions: {
        allowAutomaticSingleRunInference: true,
        ecmaVersion: 2022,
        lib: ['es2023'],
        project: ['./tsconfig.jest.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
