const angular = require('angular-eslint');

module.exports = [
  {
    ignores: ['.angular/**', 'android/**', 'coverage/**', 'dist/**', 'ios/**', 'www/**'],
  },
  ...angular.configs.tsRecommended.map(config => ({ ...config, files: ['src/**/*.ts'] })),
  {
    files: ['src/**/*.ts'],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Page', 'Component'] }],
      '@angular-eslint/component-selector': ['error', {
        type: 'element',
        prefix: 'app',
        style: 'kebab-case',
      }],
      '@angular-eslint/directive-selector': ['error', {
        type: 'attribute',
        prefix: 'app',
        style: 'camelCase',
      }],
    },
  },
  ...angular.configs.templateRecommended.map(config => ({ ...config, files: ['src/**/*.html'] })),
];
