---
title: React diff算法
date: 2021-02-05
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

### 流程

通过 patch(oldVnode,Vnode)比较是否相同 isSameVnode?不相同，Vnode 代替 oldVnode,并返回 Vnode。  
相同：通过 patchVode 比较，分为四种情况

1. oldVnode 有子节点，Vnode 没有
2. oldVnode 没有子节点，Vnode 有
3. 都只有文本节点
4. 都有子节点

#### patch

```
function patch (oldVnode, vnode) {
    // some code
    if (sameVnode(oldVnode, vnode)) {
        patchVnode(oldVnode, vnode)
    } else {
        const oEl = oldVnode.el // 当前oldVnode对应的真实元素节点
        let parentEle = api.parentNode(oEl)  // 父元素
        createEle(vnode)  // 根据Vnode生成新元素
        if (parentEle !== null) {
            api.insertBefore(parentEle, vnode.el, api.nextSibling(oEl)) // 将新元素添加进父元素
            api.removeChild(parentEle, oldVnode.el)  // 移除以前的旧元素节点
            oldVnode = null
        }
    }
    // some code
    return vnode
}
```

#### patchVnode

```
patchVnode (oldVnode, vnode) {
    // 获取真实的dom
    const el = vnode.el = oldVnode.el
    let i, oldCh = oldVnode.children, ch = vnode.children
    // 虚拟dom和老dom相同
    if (oldVnode === vnode) return
    // 都有文本节点且不相等，把真实dom的文本设置为vnode的文本节点。
    if (oldVnode.text !== null && vnode.text !== null && oldVnode.text !== vnode.text) {
        api.setTextContent(el, vnode.text)
    }else {
        updateEle(el, vnode, oldVnode)
        // oldVnode和Vnode都有子节点
        if (oldCh && ch && oldCh !== ch) {
            updateChildren(el, oldCh, ch)
        // oldVode没有，Vnode有
        }else if (ch){
            createEle(vnode) //create el's children dom
        / oldVode有，Vnode没有
        }else if (oldCh){
            api.removeChildren(el)
        }
    }
}
```
