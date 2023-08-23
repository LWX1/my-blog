---
title: webpack手写loader
date: 2021-3-2
tags:
 - webpack
categories: 
 - webpack
---

# 简介
用了这么久的vue和react框架，它们都是通过webpack搭建的，在开发的过程中也不停去熟悉webpack的配置，现在尝试去手写一个loader去更加深入了解一下webpack内部是如何工作的。

## loader的特性
+ loader支持链式调用，链中的每个loader会将转换的代码，应用在已经处理过的资源上；loader的执行顺序是逆向的。
+ loader运行在node中，可以设计同步和异步
+ loader通过options对象配置
+ loader能产生额外的任意文件

### 常见的loader
+ <code style="color: #1a6bac">babel-loader</code>  使用babel加载ES2015+ 代码并将其转换为ES5
+ <code style="color: #1a6bac">ts-loader</code>  加载TypeScript2.0+
+ <code style="color: #1a6bac">html-loader</code>  将 HTML 导出为字符串，需要传入静态资源的引用路径
+ <code style="color: #1a6bac">style-loader</code>  将模块导出的内容作为样式并添加到Dom中
+ <code style="color: #1a6bac">css-loader</code>  加载css文件并解析import的css文件，最终返回css代码
+ <code style="color: #1a6bac">less-loader</code>  加载并编译LESS文件
+ <code style="color: #1a6bac">sass-loader</code>  加载并编译SASS/SCSS文件
+ <code style="color: #1a6bac">stylus-loader</code>  加载并编译stylus文件
+ <code style="color: #1a6bac">thread-loader</code>  开启进程池

### 手写loader
1. 配置环境
  + 创建一个vue项目，在vue项目中的webpack中配置自己的loader；
  ```js
  vue init webpack my-loader-project(项目名)
  ```
  + 在根目录下创建loaders文件夹，然后配置resolveLoader属性，该属性是loader的加载路径。
  ```js
  resolveLoader: {
    // 表示先查找自定义的loader，再查找node_modules
    modules: [resolve('loaders'), 'node_modules'],
  }
  ```
#### 手写同步loader（清空代码中所有console.log）
  + 在loaders下创建一个clear-loader.js文件，在loader规则中配置规则；
```js
// 规则
{
  test: /\.vue$/,
  loader: 'clear-loader',
},
// loader
module.exports = function(source){
    return source.replace(/console\.log\(.*\);?\n/g, '');
}
```
#### 手写异步loader（处理less）
```js
// 规则
{
  test: /\.less$/,
  loader: 'my-less-loader',
},
// loader
const less = require("less");
function loader(source) {
  // 异步
  const callback = this.async();
  less.render(source, function (err, res) {
    let { css } = res;
    callback(null, css);
  });
}
module.exports = loader;
```
#### 手写img-loader（处理图片文件）
获取参数需要通过<code style="color: #1a6bac">loader-utils</code>中的getOptions方法；
```js
// 规则
{
  test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
  loader: 'my-url-loader',
  options: {
    limit: 10000,
    name: utils.assetsPath('img/[name].[hash:7].[ext]')
  }
},
// loader
function urlLoader(source) {
  // 获取限制大小的参数
  let {limit} = loaderUtils.getOptions(this);
  if(limit > source.length){
    // 转化为base64
    let code = `data:${mime.lookup(this.resourcePath)};base64,${source.toString('base64')}`
    return `module.exports = "${code}"`
  }else{
    return require("./file-loader").call(this, source)
  }
}
// 表示转换为二进制，不然为字符串无法显示
urlLoader.raw = true;
module.exports = urlLoader;
```

## 扩展this
1. this.addContextDependency
  - 添加目录作为lader结果的依赖
2. this.addDependency
  - 加入一个文件为产生loader结果的依赖，使它们的任何变化可以监听到。
3. this.async
  - loader-runner 这个 loader 将会异步地回调。返回 this.callback
4. this.cacheable
  - 设置缓存标识
5. this.callback
  - 可以同步或者异步调用的并返回多个结果的函数。预期的参数是：
  ```js
  this.callback(
    err: Error | null, // 必填 Error 或 null
    content: string | Buffer,  
    sourceMap?: SourceMap, // 选填
    meta?: any // 选填
  );
  ```
6. this.context
  - 模块所在的目录 可以用作解析其他模块成员的上下文。
7. this.data
  - 在 pitch 阶段和 normal 阶段之间共享的 data 对象。
8. this.getOptions
  - 提取给定的 loader 选项，接受一个可选的 JSON schema 作为参数。