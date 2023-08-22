---
title: 样式规范
date: 2022-3-10
tags:
    - 规范
categories:
    - 规范
---

## css规范

### 命名

- 不使用id选择器设置样式
- 使用有意义的名词命名
- 命名全部使用小写，使用 - 分隔符
- less，scss 中的变量、函数、混合等命名使用小驼峰
- id 命名使用小驼峰
- 文件命名为小写加上 - 分隔符

### 分号

- 每个属性声明都要加上分号

## less/scss 规范

### 定义class

#### bad

```
.form-title {
    font: 'PingFang-SC-medium';
    font-size: 18px;
    font-color: #22222;
}

.form-text {
    font: 'PingFang-SC-regular';
    font-size: 14px;
    font-color: #333333;
}
```

#### good 

- 统一定义，到时可以统一更改

```
$font-normal-color = #222222; // 字体颜色
$font-light-color = #333333;
$font-family-medium = 'PingFang-SC-medium';

@mixin font-class($fontFamily, $fontSize, $fontColor) {
    font-family: $fontFamily;
    font-size: $fontSize;
    color: $fontColor;
}

@mixin font-large($size: 14px, $color: $font-normal-color) {
    @include font-class($font-family-medium, $size, $color);
}

.form-title {
    @include font-large(18px, #22222);
}

.form-text {
    @include font-large(14px, #333333);
}
```
  
## prettier 格式化工具约束

- 格式自动化
- 4个缩进
- 全部单引号
- 属性后空格
- 颜色小写
- 小数点前面添加0

```
module.exports = {
    printWidth: 100, // 设置prettier单行输出（不折行）的（最大）长度

    tabWidth: 4, // 设置工具每一个水平缩进的空格数

    useTabs: false, // 使用tab（制表位）缩进而非空格

    semi: false, // 在语句末尾添加分号

    singleQuote: true, // 使用单引号而非双引号

    trailingComma: 'none', // 在任何可能的多行中输入尾逗号

    bracketSpacing: true, // 在对象字面量声明所使用的的花括号后（{）和前（}）输出空格

    arrowParens: 'avoid', // 为单行箭头函数的参数添加圆括号，参数个数为1时可以省略圆括号

    jsxBracketSameLine: true, // 在多行JSX元素最后一行的末尾添加 > 而使 > 单独一行（不适用于自闭和元素）

    rangeStart: 0, // 只格式化某个文件的一部分

    rangeEnd: Infinity, // 只格式化某个文件的一部分

    filepath: 'none', // 指定文件的输入路径，这将被用于解析器参照

    requirePragma: false, // (v1.7.0+) Prettier可以严格按照按照文件顶部的一些特殊的注释格式化代码，这些注释称为“require pragma”(必须杂注)

    insertPragma: false, //  (v1.8.0+) Prettier可以在文件的顶部插入一个 @format的特殊注释，以表明改文件已经被Prettier格式化过了。

    proseWrap: 'preserve' // (v1.8.2+)
}
```

