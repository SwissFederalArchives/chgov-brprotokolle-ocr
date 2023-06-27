const path = require('path');
const nodeExternals = require('webpack-node-externals');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'MiradorOcrHelper',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      url: false,
    },
  },  
};

const devConfig = {
  ...config,
  entry: './demo/src/index.js',
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'demo', 'src', 'index.html'),
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'demo'),
    compress: true,
    port: 3001,
  },
};

const buildConfig = {
  ...config,
  output: {
    ...config.output,
    publicPath: '',
  },
  entry: './src/index.js',
  externals: [nodeExternals()],
};

module.exports = (env, argv) => (argv?.mode === 'production' ?  buildConfig : devConfig);