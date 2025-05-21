module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['react', 'react-hooks'],
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'prettier',
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
  };
  