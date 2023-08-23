---
title: interface和 、type的区别
date: 2020-06-12
isShowComments: false
tags:
    - typescript
categories:
    - typescript
---

## 介绍

### interface

-   interface 接口主要用于限制变量的结构，右边必须为变量结构

### type

-   type 类型也是可以用于限制变量和结构，右边可以是任何类型

## 相同点

### 都可以描述对象和函数

```ts
// interface接口
interface test {
    name: string;
    age: number;
}

interface fun {
    (name: string, age: number): void
}
// type类型
type test {
    name: string;
    age: number;
}
type fun = (name: string, age: number): void
```

### 都可以扩展

-   interface 和 type 可以相互扩展
-   interface 接口的扩展是 extends。type 类型的扩展是交叉类型&；

```ts
// 接口
interface test1{
    name: string;
}
// 类别
type test2{
    age: number;
}

// 接口扩展
interface test extends test1 {
    age: number;
}

// 类型扩展
type test = test2 & {
    name: string;
}

// 接口扩展类型别名
interface test extends test2 {
    name: string
}

// 类别扩展接口
type test = test2 & {
    age: number
}
```

## 不同点

### 不同的声明范围

-   type 右边可以为任何类型
-   interface 右边必须为变量结构

```ts
type name = string
type age = [number, string]
```

### 不同的重复定义表现

-   接口可定义多次，且会自动合并

```ts
interface test1 {
    name: string
}
interface test1 {
    age: number
}
const obj: test1 = {
    name: '222'
} // 报错：缺少age
```

-   type 定义多次，会报错

```ts
type test1 {
    name: string
}
type test1 { // Duplicate identifier 'test1'
    age: number
}
```

### 计算属性，生成映射类型

-   type 能使用 in 关键字生成映射类型，但是 interface 不行

```ts
type Keys = "test1" | "test2";
type testType = {
    [key in Keys]: string
}
const test: testType = {
    test1: '1',
    test2: '2'
}
```
