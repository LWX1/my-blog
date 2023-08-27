---
title: diff
date: 2020-7-2
---

# 简介
在传统开发中，我们更新页面和视图，主要通过jq或者原生js来操作节点进行更新；如每次改变都去操作节点，这样会很消耗性能，所以尤大大考虑通过牺牲js性能来优化对dom的操作，这就是虚拟节点。
## 虚拟节点
虚拟节点就是将DOM抽象成一个以js对象为节点的DOM树，以VNode模拟真实的DOM，通过操作抽象的DOM树来对节点的操作，再通过diff算法得到需要修改的最小单位，再更新到真实的DOM中，更新视图，极大提升性能。

## diff算法
1. 只比较统一层次，不跨层比较  
2. 标签名不同
    -   oldvnode 和 newvnode 都只有文本节点，用新文本替换旧文本
    -   oldvnode 没有子节点的，newvnode有子节点，增加子节点
    -   oldvnode 有子节点的，newvnode没有有子节点，删除子节点
3. 标签名相同，key相同，判定为相同节点，不继续深度比较
4. oldvnode 和 newvnode 都有子节点
    -   只比较同级
    -   使用首尾指针法（oldvnode 和 newvnode 都有首尾标记）
      - oldS 和 newS 比对，不成功 oldS 和 newE 比对，不成功 oldE 和 newS 比对，不成功 oldE 和 newE 比对
      - 当比对成功后，分别向中间移动

### 流程
通过patch(oldVnode,Vnode)比较是否相同isSameVnode?不相同，Vnode代替oldVnode,并返回Vnode。  
相同：通过patchVode比较，分为四种情况
1. oldVnode有子节点，Vnode没有  
2. oldVnode没有子节点，Vnode有
3. 都只有文本节点
4. 都有子节点

#### patch
```js
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
```js
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