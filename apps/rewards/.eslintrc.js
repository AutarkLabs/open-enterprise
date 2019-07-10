module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: 'prettier/react',
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
    'object-curly-spacing': ['error', 'always']
  },
  settings: {
    react: {
      version: 'detect',
    },
  }
}
