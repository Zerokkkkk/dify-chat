import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'ts/switch-exhaustiveness-check': 'off',
    'ts/strict-boolean-expressions': 'off',
    'ts/no-unsafe-member-access': 'off',
    'ts/no-unsafe-assignment': 'off',
    'ts/no-unsafe-argument': 'off',
    'ts/no-unsafe-return': 'off',
    'ts/no-unsafe-call': 'off',
    'ts/no-use-before-define': 'off',
    'ts/no-floating-promises': 'off',
    'ts/no-empty-object-type': 'off',
    'ts/ban-ts-comment': 'off',
    'unused-imports/no-unused-vars': 'warn',
    'vue/valid-attribute-name': 'off',
    'prefer-promise-reject-errors': 'off',
    'unicorn/new-for-builtins': 'off',
    'unicorn/no-new-array': 'off',
    'no-console': 'warn',
    'curly': [
      'error',
      'multi-line',
      'consistent',
    ],
  },

  lessOpinionated: true,
  formatters: true,
})
