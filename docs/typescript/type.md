---
title: 数据类型
date: 2020-06-10
isShowComments: false
tags:
    - typescript
categories:
    - typescript
---

# boolean 布尔值

```
let a:boolean=false;
```

# number 数字

```
let a:number = 10;
let a:number = 0xf00d; // 十六进制
let a:number = 0b1010; // 二进制
let a:number = 0o744; // 八进制

//编译后
var a = 10;
var a = 0xf00d; // 十六进制
var a = 10; // 二进制
var a = 484; // 八进制
```

# string 字符串

```
let a:string = '10';
let b:string = `${ a }`; // 模板字符串定义
// 编译后
var a = '10';
var b = "h" + a + "j"; // 模板字符串定义
```

# 数组 Array

```
let a: number[] = [1, 2, 3];
let b: Array<number> = [1, 2, 3];
// 编译后
var a = [1, 2, 3];
var b = [1, 2, 3];
```

# 元组 Tuple

```
let a: [string, number];
let x = ['hello', 10];
// 当访问一个越界的元素，会使用联合类型替代：
x[4] = 10;
x[3] = true; // error 布尔不是(string | number)类型
```

# 枚举 enum

```
enum Color {Red, Green, Blue}
let c: Color = Color.Green;
// 编译
var Color;
(function (Color) {
    Color[Color["Red"] = 0] = "Red";
    Color[Color["Green"] = 1] = "Green";
    Color[Color["Blue"] = 2] = "Blue";
})(Color || (Color = {}));
var c = Color.Green;
```

# 任意类型 any

```
let a:any='b';
a = 2;
// 编译
var a = 'b';
a = 2;
```
