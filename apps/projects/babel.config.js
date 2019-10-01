module.exports = api => ({
  presets: [
    [
      '@babel/preset-env',
      {
        modules: api.env('test') ? 'commonjs' : false,
        useBuiltIns: false,
        targets: { node: 'current' },
      }
    ]
  ],
  plugins: [
    ['styled-components', { 'displayName': true }],
    '@babel/plugin-proposal-class-properties',
    'react-hot-loader/babel',
    '@babel/plugin-transform-runtime'
  ]
})
