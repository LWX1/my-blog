---
title: React fiber
date: 2021-02-06
isShowComments: false
tags:
    - react
categories:
    - react
---

## fiber 是什么

### 问题

-   在 fiber 出现之前，即 React16 之前，React 更新视图主要是通过 setState 方法触发，从而更新视图。假如当我们有很多个组件需要更新，setState 方法需要通过 diff 去对比需要更新的节点，这个时间可能久一点；因为 js 是单线程的，这样会导致很多事件陷入等待状态，给人卡顿的感觉。

### 解决

-   由于上面的卡顿问题，从而导致 fiber 的出现；fiber 主要将一个 diff 任务分割成很多个小的任务执行，每个任务都有优先级，优先级高的可以打断优先级低的任务

-   js 在执行过程中，会有很多空闲的时间片，为了优化 react，利用空闲时间片，新增异步方法<font color="orange">requestIdleCallback</font>，该方法在浏览器空闲时执行，从而解决一个 diff 一直占用的卡顿问题。

-   <font color="orange">requestIdleCallback</font>方法将在浏览器空闲时间段调用函数，这样不会影响主事件上的 js 执行，再完成一部分任务，即时间片用完时，将控制权交回个浏览器主事件，继续先前的任务。

-   fiber 数是一个链表结构；主要由三个属性连接起来，<font color="orange">return</font>指向父节点， <font color="orange">sibling</font>指向兄弟节点，<font color="orange">children</font>指向子节点。

-   fiber 的树结构主要是通过<font color="orange">深度优先遍历</font>，该遍历方式可以保证生命周期的稳定性；遍历先找孩子<font color="orange">children</font>，没有就找兄弟<font color="orange">sibling</font>，再找父亲<font color="orange">return</font>

## fiber 对象

```ts
type Fiber = {
  // 用于标记fiber的WorkTag类型，主要表示当前fiber代表的组件类型如FunctionComponent、ClassComponent等
  tag: WorkTag,
  // ReactElement里面的key
  key: null | string,
  // ReactElement.type，调用`createElement`的第一个参数
  elementType: any,
  // The resolved function/class/ associated with this fiber.
  // 表示当前代表的节点类型
  type: any,
  // 表示当前FiberNode对应的element组件实例
  stateNode: any,

  // 指向他在Fiber节点树中的`parent`，用来在处理完这个节点之后向上返回
  return: Fiber | null,
  // 指向自己的第一个子节点
  child: Fiber | null,
  // 指向自己的兄弟结构，兄弟节点的return指向同一个父节点
  sibling: Fiber | null,
  index: number,

  ref: null | (((handle: mixed) => void) & { _stringRef: ?string }) | RefObject,

  // 当前处理过程中的组件props对象
  pendingProps: any,
  // 上一次渲染完成之后的props
  memoizedProps: any,

  // 该Fiber对应的组件产生的Update会存放在这个队列里面
  updateQueue: UpdateQueue<any> | null,

  // 上一次渲染的时候的state
  memoizedState: any,

  // 一个列表，存放这个Fiber依赖的context
  firstContextDependency: ContextDependency<mixed> | null,

  mode: TypeOfMode,

  // Effect
  // 用来记录Side Effect
  effectTag: SideEffectTag,

  // 单链表用来快速查找下一个side effect
  nextEffect: Fiber | null,

  // 子树中第一个side effect
  firstEffect: Fiber | null,
  // 子树中最后一个side effect
  lastEffect: Fiber | null,

  // 代表任务在未来的哪个时间点应该被完成，之后版本改名为 lanes
  expirationTime: ExpirationTime,

  // 快速确定子树中是否有不在等待的变化
  childExpirationTime: ExpirationTime,

  // fiber的版本池，即记录fiber更新过程，便于恢复
  alternate: Fiber | null,
}

```
