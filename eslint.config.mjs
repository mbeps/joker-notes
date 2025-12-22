import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Disable setState in effect rule - intentional pattern for client-side hydration
      'react-hooks/set-state-in-effect': 'off',
      // Allow empty interfaces for props types that may be extended later
      '@typescript-eslint/no-empty-object-type': 'off',
      // React Compiler lint rules are included in react-hooks/recommended
      // (already part of next/core-web-vitals) - validates Rules of React
    },
  },
  {
    // Relax rules for test files
    files: ['__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'convex/_generated/**',
    'node_modules/**',
  ]),
]);

export default eslintConfig;
