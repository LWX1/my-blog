---
title: React createElement
date: 2023-3-9
isShowComments: false
tags:
    - react源码
categories:
    - react源码
---

## 创建 react Element 元素

### createElement

```js
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

/**
 * @type 节点类型 / 组件函数 可以判断是否为函数，函数则为组件，不然是div、span 等
 * @config react 的一些配置 key ref prop
 * @children 子节点
 * @returns ReactElement
 */
export function createElement(type, config, children) {

  let propName;
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {

    // 判断是否有ref
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    // 判断是否有key
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;

    // 保存属性
    for (propName in config) {
      
      // 判断属性是否是 object 里面的属性
      // 并且在 RESERVED_PROPS 对象中不存在的属性  
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.

  // 获取 children 的长度   
  const childrenLength = arguments.length - 2;

  // 只有一个 children
  if (childrenLength === 1) {
    props.children = children;

  // 多个 children
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  // element 上默认的属性
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}
```

### ReactElement

```js
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    // 判断是否为 react Element，才会被渲染成dom 元素
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    // dom 元素 div span 等，为组件时，则为组件的构造函数
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };

  return element;
};
```

## 总结

### 优点

- 当我们在更改**dom** 的操作中，假如直接一个个操作**dom**，可能会导致卡顿的现象，毕竟操作**dom** 的代价是比较大的，但我们可以通过操作**js**，通过计算，先保存需要更改的**dom**，然后再批量去更改**dom**，这样就可以在牺牲**js**的前提下，减少**dom** 的开发，通过**vnode**，我们不需要手动去操作**dom**，只需编写好**view-model** 的代码，实现了便捷。
- **vnode** 不仅可以让我们节省**dom** 的开销，我们通过**vode** 还可以实现跨平台开发，毕竟**vnode** 是一个对象，通过遍历这个对象，我们可以转换为各个平台中，我们需要的对应代码。

### 缺点

- 不管**vnode** 是怎么把**js** 转为**dom**，其实都要经过操作真实的**dom**，所以我们直接操作真实的**dom**，一定会比**vnode** 的速度要快，毕竟**vnode** 需要通过一系列的计算才去批量操作真实的**dom**。
