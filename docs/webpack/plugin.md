---
title: plugin配置
date: 2020-10-4
isShowComments: false
---

# 基本配置

## Plugin

- loader 相当于一个转换器，一般只作于文件之间的转换；所以有很多事情是无法完成的，这是需要用到 webpack.
- plugin 是一个扩展器，在 webapck 使用 loader 完成转换后，plugin 针对转换后的文件来进行更多的操作；如打包优化、压缩等。

## 常见的 plugin

### html-webpack-plugin

- 该插件生成一个 html5 文件，在 body 中使用 script 标签引入 webapck 生成的 bundle；

```js
new HtmlWebpackPlugin({
    title: 'app', // 默认模板中title标签名字
    filename: 'index.html',  // 输出文件、默认为index.html
    template: 'src/assets/index.html' // 指定模板
})
```

### copy-webpack-plugin

- 该插件用于复制文件，不做任何处理

```js
new CopyWebpackPlugin([
    {
        from: path.resolve(__dirname, '../static'), // 被复制文件的路径
        to: 'static', // 复制文件的位置
        ignore: ['*.txt'], // 忽略txt后缀的文件
        flatten: true  // 只拷贝文件，不管文件夹， 默认为false
    }
])
```

### DefinePlugin

- 定义全局变量，一般用于环境的判断，或者接口的切换

```js
new webpack.DefinePlugin({
    serviceApi : "'home/'",
    serviceApi2 : "home",
    'process.env': require('../config/dev.env')
})
// 调用 
// 在组件中直接console.log(serviceApi, serviceApi2, process.env)
// 编译成 字符串'home/',变量home和process.env
```

### DllPlugin 和 DLLReferencePlugin

- 拆分 bundles,DllPlugin 生成一个名为 manifest.json 的文件，再 DLLReferencePlugin 映射到相关的依赖中
- 创建一个 webpack.dll.conf.js 文件

```js
module.exports = {
    entry: {
        jquery: ['jquery']
    },
    output: {
        filename: '[name].js',
        path: resolve(__dirname, 'dll/dll'),
        library: '[name]_[hash]' // 向外暴露的名字
    },
    plugins: [
        new webpack.DllPlugin({
            name: '[name]_[hash]',
            path: resolve(__dirname, 'dll/dll/mainfest.json')
        })
    ],
}
// webpack --config  webpack.dll.conf.js 运行文件，打包进行缓存；
```

- webpack.config.js 中

```js
// 告诉webpack哪些库不参与打包
new webpack.DllReferencePlugin({
    manifest: resolve(__dirname, '../dll/dll/mainfest.json')
}),
// 复制dll下的文件到项目中
new CopyWebpackPlugin([
    {
        from: path.resolve(__dirname, '../dll'),
        to: '',
        ignore: ['.*'],
    }
]),
// 在index.html中手动引入文件
<script src="./dll/jquery.js"></script>
```

### extract-text-webpack-plugin

- 将所有入口中的 chunk 引入的\*.css 单独分离成一个文件；样式将不会嵌入到 script 标签中；

```js
{
    test: /\.css$/,
    use: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: "css-loader"
    })
}
// plugin 
new ExtractTextPlugin({
    filename: 'css/[name].[contenthash].css',
}),
```

- use：指定需要什么样的 loader 去编译文件
- fallback：编译后用什么 loader 来提取文件
- allChunks：从所有额外的 chunk 中提交

### mini-css-extract-plugin

- 与 extract-text-webpack-plugin 一样，将 css 提取到单独文件，但是前者不再维护，一般用于 webpack4 之前，后者只能适用于 webpack4 或 webpack4 之后

```js
{
    test: /\.css$/,
    use: [
        {
        loader: MiniCssExtractPlugin.loader,
        },
        "css-loader"
    ]
}
// plugins 
plugins:[
        new MiniCssExtractPlugin({
            filename: '[name]-main.css', // 入口文件名字
            chunkFilename: '[name]-[hash].css' // 非入口文件名字
        }),
    ],
```

### LimitChunkCountPlugin

- 限制 chunk 的数量，以便减少请求

```js
 plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 5, // 限制最多几个chunk
      minChunkSize: 1000, // 限制最小大小
    })
  ]
```

### MinChunkSizePlugin

- 通过合并小于某个大小的 chunk，将 chunk 的体积限制在某个大小之上

```js
new webpack.optimize.MinChunkSizePlugin({
  minChunkSize: 10000 // Minimum number of characters
});
```

### splitChunks

- 提取和分离代码，主要作用提取公共代码，防止代码被重复打包，拆分过大的 js 文件，合并零散的 js 文件

```js
optimization: {
    splitChunks: {
      chunks: 'async', // 需要提取的文件，异步加载文件
      minSize: 30000, // 压缩前最小提取大小
      maxSize: 0, // 提取出来的文件打包压缩不允许超过某个大小，超过了得重新分割打包
      minChunks: 1, // 提取的文件最少被引用次数，引用次数超于或等于才能被提取
      maxAsyncRequests: 5, // 最大异步加载次数
      maxInitialRequests: 3, // 入口文件被加载时，允许同时加载多少个js文件
      automaticNameDelimiter: '~', // 打包生成的js文件的分隔符
      name: true, // 打包生成的js名称 true 自动生成文件名
      cacheGroups: { // 匹配提取模块的方案 缓存组，可覆盖外面的配置
        vendors: {
          test: /[\\/]node_modules[\\/]/, // 提取模块资源的名称
          priority: -10  // 方案的优先级，越大越高
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true // ture时重用已经打包生成的新js文件，而不是重新打包
        }
      }
    }
}
```

### terser-webpack-plugin

- 压缩 js

```
optimization: {
    minimizer: [
        new TerserPlugin({
            test: /\.js(\?.*)?$/i, // 匹配压缩规则
            parallel: true, // 使用多进程并发
            terserOptions: { // terser 压缩配置

            },
            extractComments: true, // 注释剥离
            cache: true, // 开启缓存
        }),
    ],
},
```

- include：要包括的文件
- exclude：排除的文件
