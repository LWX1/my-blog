---
title: loader配置
date: 2020-10-3
isShowComments: false
---

# loader

- webpack 可以使用 loader 来预处理文件，允许你打包除 JavaScript 之外的任何静态资源。

# 常见 API

- this.async 异步回调 loader，返回 this.callback
- this.getOptions 获取 loader 中的 options
- this.emitFile 产生一个文件
- this.utils.contextify 返回相对路径
- this.utils.absolutify 返回绝对路径

## 常见的 loader

### url-loader

- 用于处理图片，可以设置限制大小参数(默认为 8k)，让其转为 base64;超过限制的大小，则使用里面内置的 file-loader 处理；
- webpack5 内置为<span style="color: #1840ff">asset/inline</span>

```
{
    test: /\.(png|jpe?g|gif|svg)$/,
    type: 'asset/inline',
}
```

### file-loader

- 用于转化输出，可用于处理字体图标和 txt 文件；
- webpack5 内置为<span style="color: #1840ff">asset/resource</span>

```
{
    test: /\.(ttf|woff|woff2)$/,
    type: 'asset/resource',
    generator: {
        filename: 'font/[name].[contenthash:8].[ext]' // 局部指定输出位置
    }
}
```

### raw-loader

- 加载文件原始内容，一般用于处理 txt 文本。
- webpack5 内置为<span style="color: #1840ff">asset/source</span>

```
{
    test: /\.txt$/,
    type: 'asset/source',
}
```

### babel-loader

- 将 es6 以上的语法转化为 es5 的语法

```
{
    test: /\.js$/,
    exclude: ['/node_modules/'],
    use: {
        loader: 'babel-loader',
        options: {
            presets: [
                [
                    "@babel/preset-env",
                    {
                        // 按需加载
                        useBuiltIns: "entry",
                        corejs: {
                            version: 3
                        },
                        // caller.target 等于 webpack 配置的 target 选项
                        targets: { chrome: "58", ie: "9" }
                    }
                ]
            ],
            cacheDirectory: true // 缓存
        }
    }
}
```

- 扩展
  @babel/polyfill 最全面的兼容，全部一起引入，但是文件较大,污染全局；
  @babel/runtime 不侵入原型链上的方法，体积小，所以'foo'.includes('f')无法使用；依靠@babel/plugin-transform-runtime 实现代码复用
  @babel-preset-env 可以配置按需引入，根据浏览器的版本引入

### css-loader

- 解析 css 文件，但不对样式进行处理，所以一般配合 style-loader 一起使用
- url 参数，默认为 true；允许为函数进行配置

```
<!-- 开启时 -->
url('image.png') => require('./image.png')
<!-- 引用node_modules 使用~表示根目录-->
url(~module/image.png) => require('module/image.png')
<!-- 使用函数 -->
{
    test: /\.css$/,
    loader: 'css-loader',
    options: {
        url: (url, resourcePath) => {
        // resourcePath - path to css file
        // 转化
        return url.includes('img.png');
        },
    },
}
```

- modules 参数 默认为 false，为 true 时则开启唯一的 class 值

```
<!-- webpack配置 -->
{
    test: /\.css$/,
    loader: 'css-loader',
    options: {
        modules: true,
        localIdentName: '[name]__[local]--[hash:base64:5]', // 转化后的名字
    },
}
<!-- css中 -->
.className {
  background: red;
} ==> .className_23_aKvs-b8bW2Vg3fwHozO {
  background: red;
}
```

### postcss-loader

- 用于处理样式兼容性；如添加浏览器前缀，压缩 css

```
<!-- package.json 配置兼容的范围-->
"browserslist": [
    "> 1%",
    "last 2 versions",
    "ie 9"
],
<!-- webpack -->
{
    loader: 'postcss-loader',
    options: {
        postcssOptions: {
            plugins: [
                [
                    'autoprefixer', // 自动添加浏览器前缀
                    {
                        // 选项
                    },
                ],
            ],
        },
    },
},
```

### style-loader

- 处理样式，由 css-loader 解析后的 css 文件，传给 style-loader 处理，通过创建标签引入；

### less-loader

- 将 Less 编译为 CSS 的 loader。

### sass-loader

- 将 Sass/SCSS 文件并将他们编译为 CSS

### html-loader

- 将 HTML 导出为字符串.当编译器需要时，将压缩 HTML 字符串。
- source 默认为 true；对 html 里面的标签含有引入链接形式的都转为 require 引入；配置其他 loader 转化标签静态图片。
- preprocessor 默认为 undefined；允许在处理之前对内容进行预处理。

### thread-loader

- 创建线程池，需要放置在其他 loader 之前，会运行在一个独立的 worker 池中
- worker 池中的 loader 有限制

1. 这些 loader 不能生成新的文件
2. 这些 loader 不能使用自定义的 loader API（也就是说，不能通过插件来自定义）
3. 这些 loader 无法获取 webpack 的配置
4. 每个 worker 都是一个独立的 node.js 进程，其开销大约为 600ms 左右。同时会限制跨进程的数据交换
