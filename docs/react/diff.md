---
title: React diff算法
date: 2021-02-04
isShowComments: false
tags:
    - react
categories:
    - react
---

## 介绍

-   react 主要通过虚拟 DOM 即 js 来操作真实 DOM，而在虚拟 DOM 中，diff 算法就是一个加速器，能够快速定位需要操作得 DOM，是解决页面快速渲染的基础，提高性能的保障。

## 原理

-   diff 算法主要遵循三个层次的策略

1. tree 层级

2. component 层级

3. element 层级

### tree 层级

-   DOM 先会同层节点比较，不会跨层操作，同层之间只有删除和创建操作。每层对比，新增则直接创建，删除则删除，不会有移动操作
    ![结果](/img/react/diff_tree.jpg)

### component 层级

-   如果不是同一个组件，则直接删除这个组件下的所有子节点，创建新的组件。

### element 层级

-   同一层级的节点，每个节点都有唯一的<font color="orange">key</font>标识。
-   同一节点操作，有插入、移动和删除。

1. 新旧集合都是相同<font color="orange">key</font>节点，无需删除和插入，只需移动；

-   如[1,2,3,4,5] ==> [1,3,2,5,4]：则移动 2 到 3 后面，4 到 5 后面；移动规则，则是旧的下标和新的下标对比，旧的下班小于新的下标则需要移动到新下标的位置，反之则不动。

2. 对比<font color="orange">key</font>，发现新旧集合有移动和增删操作；

-   如[1,2,3,4,5] ==> [1,3,2,5,6]：先移动 2 到 3 后面，没有 4 节点，则删除，再新增 6 节点到 5 的后面
