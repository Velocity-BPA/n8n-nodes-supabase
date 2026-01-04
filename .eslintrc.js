module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  plugins: ['@typescript-eslint', 'n8n-nodes-base'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:n8n-nodes-base/community',
    'prettier',
  ],
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', 'gulpfile.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'n8n-nodes-base/node-param-description-missing-from-dynamic-options': 'off',
    'n8n-nodes-base/node-param-description-wrong-for-dynamic-multi-options': 'off',
    'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
    'n8n-nodes-base/node-param-options-type-unsorted-items': 'off',
  },
};
