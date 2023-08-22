---
title: js/ts规范
date: 2022-3-10
tags:
    - 规范
categories:
    - 规范
---

## js/ts规范

### 变量/函数

- 小驼峰
- 有意义的命名（见名知意）
- 函数的参数应该注释其意思
  
```
<!-- bad -->
let a = 10;
function fun() {}

<!-- good -->
let maxCount = 10;

/**
 * 获取最大的数 
 * @params dataArr 传入数组；
 * @returns 返回最大的数
 */ 
function getMaxCount(dataArr) {}
```

### 接口

- 使用I做为接口前缀

```
<!-- bad -->
interface IMenu {
    test: string;
}

<!-- good -->
interface IMenu {
    test: string;
}

```

### 枚举

- 使用大驼峰
  
```
<!-- bad -->
enum status {}

<!-- good -->
enum Status {}
```

### 常量

- 全部大写，_ 分隔符隔开
  
```
<!-- bad -->
const successCode = {
    info: 200,
    warning: 300,
}

<!-- good -->
const SUCCESS_CODE = {
    INFO: 200,
    WARNING: 300,
}
```

### 类

- 大驼峰
- 类的作用描述
- 类里面的属性和方法描述
- 私有属性中，可以使用private就使用，不然使用 _ 前缀
  
```
<!-- bad -->
class person{}

<!-- good -->
/**
 * 定义人的特征类
 *
 */
class Person {
    // 年龄
    private age: 0;
    // 性别
    private sex: 0;

    // 获取性别
    getSex() {
        return this.sex;
    }
}
```

### 注释

#### 单行

```
// 单行注释，斜杠后空一格
let maxCount = 123;
```

#### 多行

```
/**
 * 多行注释
 */
```

### 特定标记值

```
<!-- bad -->
let type = 1; // 1 新增 2 修改

<!-- good -->
const TYPE = {
    ADD: 1,
    EDIT: 2
}
```

### 分支

- if 超过四个，使用switch；或者类型相同

```
<!-- bad -->
let type = typeof variable;
if (type === 'object') {

} else if (type === 'number' || type === 'boolean' || type === 'string') {

}

<!-- good -->
switch (typeof variable) {
    case 'object':
        break;
    case 'number':
    case 'boolean':
    case 'string':
        break;
}

```

### 其他规范

- 格式自动化
- 4 个缩进
- 全部单引号
- 关键词后面有空格

#### tsconfig.json 配置

```
{
  "compilerOptions": {
    /* 基本选项 */
    "target": "es5",                       // 指定 ECMAScript 目标版本: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', or 'ESNEXT'
    "module": "commonjs",                  // 指定使用模块: 'commonjs', 'amd', 'system', 'umd' or 'es2015'
    "lib": [],                             // 指定要包含在编译中的库文件
    "allowJs": true,                       // 允许编译 javascript 文件
    "checkJs": true,                       // 报告 javascript 文件中的错误
    "jsx": "preserve",                     // 指定 jsx 代码的生成: 'preserve', 'react-native', or 'react'
    "declaration": true,                   // 生成相应的 '.d.ts' 文件
    "sourceMap": true,                     // 生成相应的 '.map' 文件
    "outFile": "./",                       // 将输出文件合并为一个文件
    "outDir": "./",                        // 指定输出目录
    "rootDir": "./",                       // 用来控制输出目录结构 --outDir.
    "removeComments": true,                // 删除编译后的所有的注释
    "noEmit": true,                        // 不生成输出文件
    "importHelpers": true,                 // 从 tslib 导入辅助工具函数
    "isolatedModules": true,               // 将每个文件做为单独的模块 （与 'ts.transpileModule' 类似）.

    /* 严格的类型检查选项 */
    "strict": true,                        // 启用所有严格类型检查选项
    "noImplicitAny": true,                 // 在表达式和声明上有隐含的 any类型时报错
    "strictNullChecks": true,              // 启用严格的 null 检查
    "noImplicitThis": true,                // 当 this 表达式值为 any 类型的时候，生成一个错误
    "alwaysStrict": true,                  // 以严格模式检查每个模块，并在每个文件里加入 'use strict'

    /* 额外的检查 */
    "noUnusedLocals": true,                // 有未使用的变量时，抛出错误
    "noUnusedParameters": true,            // 有未使用的参数时，抛出错误
    "noImplicitReturns": true,             // 并不是所有函数里的代码都有返回值时，抛出错误
    "noFallthroughCasesInSwitch": true,    // 报告 switch 语句的 fallthrough 错误。（即，不允许 switch 的 case 语句贯穿）

    /* 模块解析选项 */
    "moduleResolution": "node",            // 选择模块解析策略： 'node' (Node.js) or 'classic' (TypeScript pre-1.6)。默认是classic
    "baseUrl": "./",                       // 用于解析非相对模块名称的基目录
    "paths": {},                           // 模块名到基于 baseUrl 的路径映射的列表
    "rootDirs": [],                        // 根文件夹列表，其组合内容表示项目运行时的结构内容
    "typeRoots": [],                       // 包含类型声明的文件列表
    "types": [],                           // 需要包含的类型声明文件名列表
    "allowSyntheticDefaultImports": true,  // 允许从没有设置默认导出的模块中默认导入。

    /* Source Map Options */
    "sourceRoot": "./",                    // 指定调试器应该找到 TypeScript 文件而不是源文件的位置
    "mapRoot": "./",                       // 指定调试器应该找到映射文件而不是生成文件的位置
    "inlineSourceMap": true,               // 生成单个 soucemaps 文件，而不是将 sourcemaps 生成不同的文件
    "inlineSources": true,                 // 将代码与 sourcemaps 生成到一个文件中，要求同时设置了 --inlineSourceMap 或 --sourceMap 属性

    /* 其他选项 */
    "experimentalDecorators": true,        // 启用装饰器
    "emitDecoratorMetadata": true,         // 为装饰器提供元数据的支持
    "strictFunctionTypes": false           // 禁用函数参数双向协变检查。
  },
  /* 指定编译文件或排除指定编译文件 */
  "include": [
      "src/**/*"
  ],
  "exclude": [
      "node_modules",
      "**/*.spec.ts"
  ],
  "files": [
    "core.ts",
    "sys.ts"
  ],
  // 从另一个配置文件里继承配置
  "extends": "./config/base",
  // 让IDE在保存文件的时候根据tsconfig.json重新生成文件
  "compileOnSave": true // 支持这个特性需要Visual Studio 2015， TypeScript1.8.4以上并且安装atom-typescript插件
}

```

#### prettierrc 配置

```
module.exports = {
 
  printWidth: 100, //行宽
 
  semi: true, //分号
 
  singleQuote: true, // 使用单引号
 
  useTabs: false, //使用 tab 缩进
 
  tabWidth: 4, //缩进
 
  trailingComma: 'es5', //后置逗号，多行对象、数组在最后一行增加逗号
 
  arrowParens: 'avoid', //箭头函数只有一个参数的时候可以忽略括号
 
  bracketSpacing: true, //括号内部不要出现空格
 
  proseWrap: 'preserve', //换行方式 默认值。因为使用了一些折行敏感型的渲染器（如GitHub comment）而按照markdown文本样式进行折行
 
  parser: 'babylon', //格式化的解析器，默认是babylon
 
  endOfLine: 'auto', // 结尾是 \n \r \n\r auto
 
  jsxSingleQuote: false, // 在jsx中使用单引号代替双引号
 
  jsxBracketSameLine: false, //在jsx中把'>' 是否单独放一行
 
  stylelintIntegration: false, //不让prettier使用stylelint的代码格式进行校验
 
  eslintIntegration: false, //不让prettier使用eslint的代码格式进行校验
 
  tslintIntegration: false, // 不让prettier使用tslint的代码格式进行校验
 
  disableLanguages: ['vue'], // 不格式化vue文件，vue文件的格式化单独设置
 
  htmlWhitespaceSensitivity: 'ignore',
 
  ignorePath: '.prettierignore', // 不使用prettier格式化的文件填写在项目的.prettierignore文件中
 
  requireConfig: false, // Require a 'prettierconfig' to format prettier
}
```

```
{
    // 使能每一种语言默认格式化规则
    "[html]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[css]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[less]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
}


```

