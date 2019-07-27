const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const isDevelopment = process.argv[3] !== 'production'

const configList = [
  {
    name: 'background',
    entry: './src/background/index.ts',
    template: './src/background/index.html',
    filename: 'html/background.html'
  },
  // {
  //   name: 'content',
  //   entry: './src/content/index.ts'
  // },
  {
    name: 'option',
    entry: './src/option/index.ts',
    template: './src/option/index.html',
    filename: 'html/option.html'
  },
  {
    name: 'popup',
    entry: './src/popup/index.ts',
    template: './src/popup/index.html',
    filename: 'html/popup.html'
  }
]

const htmlPlugins = []
configList.forEach(entry => {
  if (entry.template)
    htmlPlugins.push(
      new HtmlWebpackPlugin({
        inject: 'head',
        filename: entry.filename,
        template: entry.template,
        chunks: [entry.name],
        minify: {
          // 移除注释
          removeComment: true,
          // 折叠空格
          collapseWhitespace: true
        }
      })
    )
})

const generateManifest = content =>
  content.toString().replace(/##\[(.*)\](.*)##/g, (word, type, name) => {
    const entry = configList.find(item => item.name === name)
    if (!entry && type !== 'config') return word
    switch (type) {
      case 'html':
        return entry.filename
      case 'js':
        return `js/${entry.name}.js`
      case 'config':
        return process.env[`npm_package_${name}`]
      default:
        break
    }
    return word
  })

module.exports = {
  mode: 'production',
  entry: () => {
    const entry = {}
    configList.forEach(item => {
      entry[item.name] = item.entry
    })
    return entry
  },
  devtool: 'hidden-source-map',
  plugins: [
    ...htmlPlugins,
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin(
      [
        {
          from: './src/manifest.json',
          to: '',
          transform: generateManifest
        },
        {
          from: './src/static/',
          to: ''
        },
        {
          from: './src/content/index.js',
          to: 'js/content.js'
        }
      ],
      { copyUnmodified: true }
    )
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: isDevelopment
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          sass: {
            loader: 'sass-loader',
            options: {
              indentedSyntax: true,
              sourceMap: isDevelopment
            }
          },
          scss: {
            loader: 'sass-loader',
            options: {
              sourceMap: isDevelopment
            }
          }
        }
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        include: [path.resolve(__dirname, 'src')]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'img/[name].[ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      '@': './src'
    }
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist')
  }
}
