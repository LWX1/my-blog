---
title: React fiber
date: 2023-3-9
isShowComments: false
tags:
    - react源码
categories:
    - react源码
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


## fiber 数据结构

```js
function FiberNode(
  tag         ,
  pendingProps       ,
  key               ,
  mode            ,
) {
  /*********** Instance **************/ 
  // 标记不同的组件类型
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  // 组件类型 div span，函数时为组件的构造函数
  this.type = null;
  // 实例，类组件实例，原生dom实例。function组件为空
  this.stateNode = null;

  /*********** Fiber **************/ 
  // 父级 fiber
  this.return = null;
  // 子级 fiber
  this.child = null;
  // 兄弟 fiber
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  /************** 状态 *********/
  // 即将更新得 props
  this.pendingProps = pendingProps;
  // 保存得 props
  this.memoizedProps = null;
  // 更新得队列
  this.updateQueue = null;
  // 保存得 state
  this.memoizedState = null;
  // 
  this.dependencies = null;

  // 渲染方式
  this.mode = mode;

  /*********** Effects **************/ 
  // 记录 fiber 的状态
  this.flags = NoFlags;
  // 当前子节点的副作用状态
  this.subtreeFlags = NoFlags;
  // 删除的节点
  this.deletions = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  // workInProgress 树中对应得 fiber
  this.alternate = null;

  if (enableProfilerTimer) {
    // Note: The following is done to avoid a v8 performance cliff.
    //
    // Initializing the fields below to smis and later updating them with
    // double values will cause Fibers to end up having separate shapes.
    // This behavior/bug has something to do with Object.preventExtension().
    // Fortunately this only impacts DEV builds.
    // Unfortunately it makes React unusably slow for some applications.
    // To work around this, initialize the fields below with doubles.
    //
    // Learn more about this here:
    // https://github.com/facebook/react/issues/14365
    // https://bugs.chromium.org/p/v8/issues/detail?id=8538
    this.actualDuration = Number.NaN;
    this.actualStartTime = Number.NaN;
    this.selfBaseDuration = Number.NaN;
    this.treeBaseDuration = Number.NaN;

    // It's okay to replace the initial doubles with smis after initialization.
    // This won't trigger the performance cliff mentioned above,
    // and it simplifies other profiler code (including DevTools).
    this.actualDuration = 0;
    this.actualStartTime = -1;
    this.selfBaseDuration = 0;
    this.treeBaseDuration = 0;
  }

}
```

## FiberRoot

```js
  // 模式ConcurrentRoot/ LegacyRoot
  this.tag = tag;
  // 容器的dom
  this.containerInfo = containerInfo;
  // 孩子
  this.pendingChildren = null;
  // rootFiber
  this.current = null;
  this.pingCache = null;
  // 是否完成工作
  this.finishedWork = null;
  // 超时处理
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.callbackNode = null;
  this.callbackPriority = NoLane;
  this.eventTimes = createLaneMap(NoLanes);
  this.expirationTimes = createLaneMap(NoTimestamp);

  // 优先级
  
  this.pendingLanes = NoLanes;
  this.suspendedLanes = NoLanes;
  this.pingedLanes = NoLanes;
  this.expiredLanes = NoLanes;
  this.mutableReadLanes = NoLanes;
  this.finishedLanes = NoLanes;

  this.entangledLanes = NoLanes;
  this.entanglements = createLaneMap(NoLanes);

  this.identifierPrefix = identifierPrefix;
  this.onRecoverableError = onRecoverableError;

  if (enableCache) {
    this.pooledCache = null;
    this.pooledCacheLanes = NoLanes;
  }

  if (supportsHydration) {
    this.mutableSourceEagerHydrationData = null;
  }

  if (enableSuspenseCallback) {
    this.hydrationCallbacks = null;
  }

  if (enableTransitionTracing) {
    this.transitionCallbacks = null;
    const transitionLanesMap = (this.transitionLanes = []);
    for (let i = 0; i < TotalLanes; i++) {
      transitionLanesMap.push(null);
    }
  }

  if (enableProfilerTimer && enableProfilerCommitHooks) {
    this.effectDuration = 0;
    this.passiveEffectDuration = 0;
  }

  if (enableUpdaterTracking) {
    this.memoizedUpdaters = new Set();
    const pendingUpdatersLaneMap = (this.pendingUpdatersLaneMap = []);
    for (let i = 0; i < TotalLanes; i++) {
      pendingUpdatersLaneMap.push(new Set());
    }
  }

```

## fiberRoot 和 rootFiber

- fiberRoot 是 fiber 数据结构对象，是最外层的对象，整个 react 渲染树的起点，里面的 containerInfo 属性就是 id 为 root 的 div; 
- rootFiber 是组件挂载点对应的 fiber 对象，如 App 组件，包含根组件的信息，如状态、props 等；以及更新和渲染相关的数据结构，如更新队列和子 fiber 链表；rootFiber 通过协调子 fiber 节点工作来完成组件的更新
- react 渲染过程中，fiberRoot 负责整个 react 应用的管理和调度， rootFiber 代表应用顶层组件；react 从 fiberRoot 开始，通过 rootFiber 逐步构建整个组件树的 fiber 节点，然后协调它们更新和渲染。 
- react 中 fiberRoot 只有一个，rootFiber 却可以有多个。

```js
fiberRoot.current === rootFiber;
rootFiber.stateNode === fiberRoot;
```
