const path = require('path');

module.exports = {
  npm: {
    esModules: true,
    umd: {
      externals: {
        react: 'React',
      },
      global: 'MiradorOcrHelper',
    },
  },
  type: 'react-component',
  webpack: {
    aliases: {
      react: path.resolve('./', 'node_modules', 'react'),
      'react-dom': path.resolve('./', 'node_modules', 'react-dom'),
    },
  },
};
