---
title: React hooks
date: 2021-02-08
isShowComments: false
tags:
    - react
categories:
    - react
---

## 介绍

-   Hooks 是 React 16.8 新增的特性，它是 react 跨版本的标志。它允许你在不编写 class 的情况下使用 state 以及其他 React 特性。
-   **完成可选**。无需重写任何已有代码就可以在组件中尝试 Hook。不想用，可以不必去学习。
-   **100%向后兼容**。Hooks 不包含任务破坏性改动
-   **现在可用**。Hooks 发布于 16.8 版本

## 为啥用 Hooks

没有 hooks 之前都是使用 class 组件，class 组件会存在一些问题。

-   难以重用和共享组件中的状态相关逻辑。
-   复杂组件难以维护和开发，每个组件生命周期里可能会包含各种互不相关的逻辑。
-   类中的 this 会占用一定内存

## Hooks 种类

### 基础 Hooks

-   useState
-   useEffect
-   useContext

### 额外的 Hooks

-   useReducer
-   useCallback
-   useMemo
-   useRef
-   useImperativeHandle
-   useLayoutEffect
-   useDebugValue
-   useDeferredValue
-   useTransition
-   useId

### Library Hooks

-   useSyncExternalStore
-   useInsertionEffect

#### useState

```
const [state, setState] = useState(initialState);
```

-   传递一个 initialState 初始值给 state，返回 state 和一个更新 state 的函数。
-   initialState 只会在组件初始化渲染中起作用，后续渲染时会被忽略。
-   setState 设置的值与上一个值相同，则会忽略更新
-   setState 也可以传递函数的方式，即

```
setState(prevState => {
  return {...state, ...prevState};
});
```

#### useEffect

```
useEffect(() => {}, [deps])
```

-   useEffect 是一个接收两个参数的副作用函数，第一个参数为函数，第二个参数为数组，里面为依赖，依赖更新会导致函数戳发。
-   当第二个数组参数为空数组时，即只会初始化时渲染一次和 class 组件的 componentDidMount 生命周期一致
-   第一个参数的函数返回值为清除函数，当组件卸载之前触发该清除函数；假如**组件多次渲染，则在执行下一个 effect 之前，上一个 effect 就已被清除**

#### useContext

```
const value = useContext(React.createContext 的返回值);
```

-   接收一个 context 对象，即 React.createContext 的返回值，相当于类组件中的 static contextType = MyContext
-   组件上层的 provider 更新时，该 hook 就会触发重渲染，并获取到最新的值，即使使用 memo 或者 shouldComponentUpdate，也会在组件本身重新渲染。

#### useReducer

```
cont reducer = (state, action) => newState;
const init = (initialArg) => 初始化后的state值
const [state, dispatch] = useReducer(reducer, initialArg, init);
```

-   useReducer 是 useState 的替代方案，在逻辑复杂和多个子值下更适用；
-   useReducer 返回一个 state 和更新 state 的函数；
-   第一个参数是调用 dispatch 后触发的更新 state 的函数；第二个参数为初始的 state 值；第三个参数为初始函数，初始 state 的值
-   dispatch 设置的值和上个值相同则会忽略更新

#### useCallback

```
const memoizedCallback = useCallback(
  () => {
    doSomething(a, b);
  },
  [a, b],
);
```

-   该 hook 缓存函数，可以监听依赖，依赖更新，函数缓存重置。
-   第一个参数为函数体，第二个参数为依赖数组。

#### useMemo

```
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

-   该 hook 缓存变量，可以监听依赖，依赖改变，变量改变。
-   第一个参数为函数变量的返回值，第二个参数为依赖数组

#### useRef

```
const refContainer = useRef(initialValue);
```

-   useRef 返回一个可变的 ref 对象，可以在.current 属性中保存一个可变的值。
-   ref 可以获取到 DOM 节点值，即

```
<div ref={myRef} />
```

-   ref 可以存储相关变量，且.current 属性不会引发组件重新渲染。

#### useImperativeHandle

```
useImperativeHandle(ref, createHandle, [deps])
```

-   该 hook 暴露所开发的值给父组件
-   该 hook 应该配合 forwardRef 一起使用。

#### useLayoutEffect

```
useEffect(() => {}, [deps])
```

-   函数签名和 useEffect 一致，但它在所有的 DOM 变更之后调用。
-   一般用于读取 DOM 部署再触发重渲染

#### useDebugValue

```
useDebugValue(value)
```

-   该 hooks 可用于 react 开发者工具中显示自定义的 hook 标签

#### useDeferredValue

```
const deferredValue = useDeferredValue(value);
```

-   该 hook 仅延迟传递给它的值。

#### useTransition

```
const [isPending, startTransition] = useTransition();
```

-   返回一个状态值表示过渡任务的状态，以及启动该过渡任务的函数

####

```
const id = useId();
```

-   生成唯一的 ID
