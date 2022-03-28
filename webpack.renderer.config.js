const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push({
  test: /\.less$/,
  use: [{ 
    loader: 'style-loader'
  }, { 
    loader: 'css-loader'
  }, { 
    loader: 'less-loader',
    options: {
      lessOptions: { // 如果使用less-loader@5，请移除 lessOptions 这一级直接配置选项。
        // modifyVars: {
        //   'primary-color': '#1DA57A',
        //   'link-color': '#1DA57A',
        //   'border-radius-base': '2px',
        // },
        javascriptEnabled: true,
      },
    },
  }],
});

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
