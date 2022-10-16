---
title: 基本配置
date: 2020-10-3
isShowComments: false
---

# webpack5

熟悉 webpack，最好的选择就是手动开始，所以我们从头搭建一个简单的不基于框架的前端项目。

## 准备工作

1. 安装[node.js](https://nodejs.org/en/)；使用 npm init 创建 package.json 版本管理文件；里面包含着我们安装的包的各个版本和项目名称和项目启动命令等等。
2. 在根目录即 package 同目录创建 build（存放 webpack 配置）、public（存放不经过 webpack 处理的公共文件）、src（项目）三个文件夹；  
   ![文件路径图](/img/webpack/init-file.png)
3. 安装 webpack; (npm install webpack webpack-cli)默认安装最新版本的；我这里是 webpack5；
4. 准备工作已完成；

## 配置输入输出

1. 最简单得配置：在 build 文件下创建 webpack.base.config.js 文件；然后在 package.json 中配置启动脚本，npm run build 启动；成功后在根目录添加了一个 dist 文件夹，里面有个 build.js 文件，即打包后的文件。  
   tip：webpack 必须包括一个 entry（入口文件）和 output（出口文件）

```
<!-- webpack.base.config.js -->
const path = require('path')

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, '../src/index'), // 单入口 默认为./src/index.js
    output: { // 出口必须为对象
        path: path.resolve(__dirname, '../dist'), // 路径
        filename: 'build.js' // 自定义文件名，不自定义默认为main；
    }
    <!-- 多入口
    entry: {
        main: path.resolve(__dirname, '../src/index'),
        jq: path.resolve(__dirname, '../src/jquery'),
        zepto: path.resolve(__dirname, '../src/zepto')
    },
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].js' // 表示以自己的名字输出，则输出三个文件；假如你想输出一个文件可以写成数组的形式
    }
    -->
}
<!-- package.json -->
"scripts": {
    "build": "webpack --config ./build/webpack.bask.config.js"
}
```

2. output 常用其他配置项

- target 定义导出的模块名字

```
<!-- index.js -->
export function fun(a) {
    console.log(2222, a);
    return 'hello world';
}
<!-- 配置 -->
output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    library: {
        name: 'result',
        type: 'assign'
    },
}
<!-- 全局 -->
result.fun() // 2222 hello world;
```

- publicPath 文件请求入口路径；用于为请求添加路径；测试该配置，需要安装插件 html-webpack-plugin，帮助自动引入文件。
  基本用法，暴露了全局变量**webpack_public_path**，用于动态更改路径
- library 把入口向外输出一个库

```
<!-- webpack配置 -->
output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    library: {
        name: 'result',
        type: 'assign'
    },
    publicPath: 'static',
}
plugins: [new HtmlWebpackPlugin()],
<!-- 打包后html引入 -->
<script defer="defer" src="static/main.js">
```

- asyncChunks 按需加载文件，默认为 true；为 false 时，全部一起导入；
- scriptType 自定义 script 类型加载异步 chunk；默认为 module

## 加载 css

1. 安装 css-loader 和 style-loader；  
   css-loader 负责解析 css 文件，但是不处理样式；  
   style-loader 负责将解析的内容插入页面，让样式生效。  
   最终打包出来的是 js 文件，它是创建 style 标签去插入样式的；--分离 css 后期优化再介绍
2. css-loader 常用参数配置

- url 默认为 true；为 false 时，不会解析 url/image-set 的路径；要去 node_modules 目录中导入数据，需要加上前缀~;  
   使用 filter 实现动态配置

```
url('~module/image.png') => require('module/image.png');
options: {
    url: {
        filter: (url, resourcePath) => {
            // resourcePath - css 文件的路径

            // 不处理 `img.png` url
            if (url.includes("img.png")) {
                return false;
            }
            return true;
        }
    },
},
```

- modules 导出为模块，默认为 undefined；使用后你的 class 样式会转换为唯一的值

```
.className {
  background-color: blue;
} => ._10B-buq6_BEOTOl9urIjf8 {
  background-color: blue;
}
```

- import 默认为 true；拥有 url 的类似配置

## 加载 html

1. 安装 html-loader；对 html 文件进行处理；

- source 默认为 true；对 html 里面的标签含有引入链接形式的都转为 require 引入；配置其他 loader 转化标签静态图片。
- preprocessor 默认为 undefined；允许在处理之前对内容进行预处理。

```
<!-- html -->
<div>
  <p>{{firstname}} {{lastname}}</p>
  <img src="image.png" alt="alt" />
<div>
<!-- webpack -->
const Handlebars = require("handlebars");
{
    test: /\.hbs$/i,
    loader: "html-loader",
    options: {
        preprocessor: (content, loaderContext) => {
        let result;

        try {
            result = Handlebars.compile(content)({
            firstname: "Value",
            lastname: "OtherValue",
            });
        } catch (error) {
            loaderContext.emitError(error);

            return content;
        }

        return result;
        },
    },
},
```

- minimize 默认为 true；开启压缩 html 字符串

## 结语

这样一个简单的项目构建就完成了，webpack 构建项目让项目变得更快更简单，我们现在只是简单的构建一下项目而已，还有很多很强大的功能我们还没用到，将在后期为大伙展示一些常用的强大功能。
