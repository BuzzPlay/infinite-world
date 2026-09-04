export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.startsWith('Merge ')],
  rules: {
    'header-max-length': [2, 'always', 100],
  },
};
