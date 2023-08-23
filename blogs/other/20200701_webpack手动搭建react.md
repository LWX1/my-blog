---
title: webpack手动搭建react项目
date: 2020-7-1
tags:
 - webpack
categories: 
 - webpack
---

# 简介
随着技术的进步，现在的项目基本都是使用了脚手架，无需自己去动手搭建项目，只需需要啥就在脚手架里添加啥就行了。但是我们也得学一下怎么手动搭建项目，这样可以方便我们以后遇到问题可以快速定位解决。

## 配置环境
1. 初始化项目 
```js
npm init
```
2. 安装项目所需的依赖包
```js
// webpack 打包工具
npm install webpack --save-dev

// webpack4版本需要
npm install webpack-cli --save-dev

// 处理html的插件,主要用于自动生成html文件
npm install --save-dev html-webpack-plugin html-loader 

// 微型express服务器，主要用于热加载，需注意要和webpack-cli版本一致，不然会报错。
npm install webpack-dev-server  --save-dev

// 安装react项目所需的包
npm install --save react react-dom 

// 安装es6转es5
// babel 核心 
npm install @babel/core --save-dev

// babel 预设插件 将es6转为es5
npm install @babel/preset-env --save-dev

// 将jsx语法转为js
npm install --save-dev @babel/preset-react 
```
3. 配置依赖包

在当前根目录下新建webpack.config.js文件。  
* webpack.config.js
```js
module.exports = {
    entry: './src/index.js',  // 入口，文件需要手动创建
    output: {
        path: path.resolve(__dirname, 'dist'),  // 出口，文件自动生产
        filename: 'bundle.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: '联系',  // 用来生成页面的 title 元素
            filename: "index.html", // 输出的 HTML 文件名，默认是 index.html, 也可以直接配置带有子目录。
            template: './public/index.html',
            // template: "./index.html",  // 模板文件路径，支持加载器，比如 html!./ index.html
            inject: true, //| 'head' | 'body' | false, 注入所有的资源到特定的 template 或者 templateContent 中，如果设置为 true 或者 body，
            //             所有的 javascript 资源将被放置到 body 元素的底部，'head' 将放置到 head 元素中。
            // favicon: 添加特定的 favicon 路径到输出的 HTML 文件中。
            // minify: { //压缩HTML文件
            //     removeComments: true,    //移除HTML中的注释
            //     collapseWhitespace: true    //删除空白符与换行符
            // },
            // hash: true | false, 如果为 true, 将添加一个唯一的 webpack 编译 hash 到所有包含的脚本和 CSS 文件，对于解除 cache 很有用。
            //             cache: true | false，如果为 true, 这是默认值，仅仅在文件修改之后才会发布文件。
            //             showErrors: true | false, 如果为 true, 这是默认值，错误信息会写入到 HTML 页面中
            // chunks: 允许只添加某些块(比如，仅仅 unit test 块)
            // chunksSortMode: 允许控制块在添加到页面之前的排序方式，支持的值：'none' | 'default' | { function} -default: 'auto'
            // excludeChunks: 允许跳过某些块，(比如，跳过单元测试的块) 
        })
    ],
    module: {
        rules: [
          {
            test: /\.(js|jsx)$/, 
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader', // 编译jsx语法
            },
          },
        ]
    }
}
``` 
* webpack和webpack-dev-server在package.json中配置
```json
"scripts": {
    "start": "webpack-dev-server --hot --open", // 热更新打开浏览器
    "build": "webpack --mode production" // 在生产模式下打包
}
```
* babel配置
babel配置,在根目录上新建babel.config.json文件或者.babelrc.json文件
```json
{
    "presets": [
      [
        "@babel/env",
        {
          "targets": {
              "ie":10,
            "edge": "17",
            "firefox": "60",
            "chrome": "67",
            "safari": "11.1"
          },
          "useBuiltIns": "usage",
          "corejs": "3.6.5"
        }
      ],
      ["@babel/preset-react"]  // 用于处理jsx文件转为js文件
    ]
}
```
另一种babel配置，根目录上新建babel.config.js文件
```js
module.exports = function (api) {
  api.cache(true);

  const presets = [
      [
        "@babel/env",
        {
          "targets": {
              "ie":10,
            "edge": "17",
            "firefox": "60",
            "chrome": "67",
            "safari": "11.1"
          },
          "useBuiltIns": "usage",
          "corejs": "3.6.5"
        }
      ],
      ["@babel/preset-react"]  // 用于处理jsx文件转为js文件
    ];
  return {
    presets
  };
}
```

## 扩展

* babel分析 babel-polyfill VS babel-runtime VS babel-preset-env

* babel-polyfill
这个polyfill会自动加载，且完全达到依赖于es5的环境；这里要注意的是babel-polyfill是一次性引入你的项目中的，并且同项目代码一起编译到生产环境。而且会污染全局变量。像Map，Array.prototype.find这些就存在于全局空间中。

* babel-runtime
babel-runtime不会污染全局空间和内置对象原型，也达到依赖于es5的环境；但也需要注意，它无法使用实例上的方法，如数组include，find等方法。

* babel-preset-env
babel-preset-env 能根据当前的运行环境，自动确定你需要的 plugins 和 polyfills。通过各个 es标准 feature 在不同浏览器以及 node 版本的支持情况；useBuiltIns就是是否开启自动支持 polyfill，它能自动给每个文件添加其需要的poly-fill。

![结果](/img/2020/webpack/file.jpg)