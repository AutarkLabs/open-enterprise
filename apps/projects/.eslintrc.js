module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    commonjs: true,
  },
  extends: [
    'prettier/react',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['react'],
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    'react/no-typos': 1,
    semi: ['error', 'never'],
    'array-bracket-spacing': [
      'error',
      'always',
      {
        objectsInArrays: false,
        arraysInArrays: false,
        singleValue: false
      }
    ],
    'object-curly-spacing': ['error', 'always'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-else-return': 'warn',
    eqeqeq: 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    }
  }
}
