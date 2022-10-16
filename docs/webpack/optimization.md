---
title: 手写loader,plugin
date: 2020-10-3
isShowComments: false
---

# 开发 loader

## 配置引用自己的 loader

```
<!-- webpack中添加属性resolveLoader，更改loader的寻找顺序 -->
resolveLoader: {
    modules: [path.join(__dirname, '..', 'loaders'), 'node_modules'],
},
<!-- loader -->
{
    test: /\.vue$/,
    loader: 'clear-loader',
},
// 我的loaders文件夹放在根目录;文件夹中有个clear-loader.js文件，即下面的清除console.log的loader，这样就成功引入使用了。

```

## 开发准则

- 单一原则
  一个 loaders 只做单一任务；这样易于维护，也便于链式调用。
- 链式调用
  顺序链式调用每个 loader
- 无状态原则
  转换不同模块，loader 中不保留状态
- 模块化
  loader 生成的模块和普通模块遵循相同的设计原则，输入和输出均为字符串。
- 绝对路径
  使用 loader-utils 中的 stringifyRequest 方法，将绝对路径和相对路径。

## 注意

- 导出的字符串应该使用 module.export 保存；这样才是使得导出的字符串是可运行的包；

## 简单同步 loader

怎么进来，怎么出去；

```
module.exports = function(source, map){
    return source
}
<!-- 提示 -->
不能使用箭头函数，因为loader内部都是需要通过this调用，比如this.sourceMap判断是否生成sourceMap
```

### 处理 console 的 loader

```
<!-- 清空console.log -->
module.exports = function(source){
    console.log(typeof source, source); // string 和 引入的文件字符串
    return source.replace(/console\.log\(.*\);?\n/g, '');
}
```

### 手写 url-loader

```
const loaderUtils = require("loader-utils");
const mime = require("mime");

function urlLoader(source) {
    let {limit} = loaderUtils.getOptions(this);
    // console.log(mime.lookup);
    if(limit > source.length){
        let code = `data:${mime.lookup(this.resourcePath)};base64,${source.toString('base64')}`
        return `module.exports = "${code}"`
    }else{
        return require("./file-loader").call(this, source)
    }
}
// raw处理的是二进制的内容
urlLoader.raw = true;
module.exports = urlLoader;
```

- loader-utils getOptions 获取配置 loader 时的 options 参数数据;parseQuery("?param=a")解析字符模板为对象;stringifyRequest(this, "loader/index.js") 将绝对路径转为相对路径

- mime 获取文件扩展名

## 异步 loader

通过 async/await 阻塞操作执行，再通过 callback 回调
callback(error,content,sourceMap)
error:无法转换，返回 error
content:转换后的内容
sourceMap:得出原内容的 sourceMap

### less-loader

```
const less = require("less");
function loader(source) {
  const callback = this.async();
  less.render(source, function (err, res) {
    let { css } = res;
    callback(null, css);
  });
}
module.exports = loader;
```

### xlsx-loader

```
const xlsx = require('node-xlsx')
<!-- 读取xlsx文件转成json输出 -->
function myXlsxLoader(source) {
    const sheets = xlsx.parse(source);
    const dataObj = {};
    const headerData = sheets.map(item => {
         dataObj[item.name] = item.data.map((ite) => {
            return ite;
        })
        return item.name;
    })
    return `module.exports = ${JSON.stringify({
        header: headerData,
        data:dataObj
    })}`
}
myXlsxLoader.raw = true;
module.exports = myXlsxLoader;
```

# 开发 plugin

## plugin 插件的开发准则

- 一个 js 类或函数，函数的 prototype 上拥有 apply 方法
- 绑定 webpack 自身的事件钩子 compiler。
- 处理 webpack 内部实例的数据
- 处理完成后 webpack 回调

## compiler 常用钩子

- afterEnvironment
  在编译器环境设置完成后调用
- entryOption
  在 webpack 选项中的 entry 被处理后调用，回调参数：context, entry
- run
  在开始读取 records 之前调用 回调参数 compiler
- beforeCompile
  在编译之前调用，可用于修改 compilation 参数；回调参数为 normalModuleFactory,contextModuleFactory,
- compile
  在编译时被调用，即 beforeCompile 之后，回调参数 normalModuleFactory,contextModuleFactory,
- compilation
  compilation 创建之后执行；回调参数 compilation, normalModuleFactory,contextModuleFactory
- emit
  输出 asset 到 output 目录之前执行；回调参数 compilation
- assetEmitted
  输出 asset 时执行；此钩子可访问输出的 asset 相关信息，如输出路径和字节内容；回调参数 file, info
- done
  在 compilation 完成时执行；回调参数 stats
- failed
  在 compilation 失败时调用。回调参数 error

## compilation 常用钩子

- buildModule
  模块构建开始之前触发，用于修改模块；回调参数 module
- succeedModule
  模块构建成功时触发；回调参数 module
- failedModule
  模块构建失败时触发；回调参数 module,error
- finishModules
  所有模块完成么有错误时触发；回调参数 modules
- optimizeModules
  模块优化开始时调用；回调参数 modules
- afterOptimizeChunks
  chunk 优化完成后触发；回调参数 chunks
- afterOptimizeTree
  在依赖树优化成功完成之后调用。回调参数 chunks modules

## compiler -> compilation 过程

- compiler.make
- compilation 的操作
- compiler.afterCompile

### 署名 plugin 和获取打包后的 js 大小

```
<!-- plugin配置 -->
const myPlugin = require('../plugins/my-plugin')

new myPlugin({
    name: `
    我的署名：lwx
    email: 1722
    phone: 13134
    `
}),
<!-- 插件 -->
class MyPlugin {
    constructor(options) {
        this.name = options.name || '';
    }
  apply(compiler) {

    const myName = this.name;
    compiler.hooks.emit.tapAsync("MyPlugin", (compilation, callback) => {
      const manifest = {};
      for (const name of Object.keys(compilation.assets)) {
        manifest[name] = compilation.assets[name].size();
        if(name.endsWith('.js') && myName) {
            let str = compilation.assets[name].source();
            <!-- 为js文件署名 -->
            compilation.assets[name] = {
                source() {
                    return `/*${myName}*/\n${str}`
                },
                size() {
                    return this.source().length;
                  },
            }
        }
      }
      <!-- 保存文件的大小文件 -->
      compilation.assets["manifest.json"] = {
        source() {
          return JSON.stringify(manifest);
        },
        size() {
          return this.source().length;
        },
      };
      callback();
    });
  }
}

module.exports = MyPlugin;

``
```
