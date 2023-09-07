---
title: React createRoot
date: 2023-03-11
isShowComments: false
tags:
    - react源码
categories:
    - react源码
---

### createRoot

- 创建 fiber，并让 fiberRoot 和 rootFiber 相关联
- 和其他fiber 相对比，rootFiber tag 为 3，确定 mode 为 某个模式（concurrentRoot、LegacyRoot）
- 确定rootFiber 的初始更新队列queue 
- 在入口节点，即root 中添加属性 __reactContainer$，指向rootFiber
- 绑定fiberRoot 在 render this 的 _internalRoot 属性上
   
```js
/**
 * @container 存放根节点的容器，一般是 id 为 root 的 div
 * @options 配置项
 * @returns 返回 FiberRootNode
 */
export function createRoot(container, options) {
	if (!isValidContainer(container)) {
		throw new Error(
			"createRoot(...): Target container is not a DOM element."
		);
	}

	warnIfReactDOMContainerInDEV(container);

	let isStrictMode = false;
	let concurrentUpdatesByDefaultOverride = false;
	let identifierPrefix = "";
	let onRecoverableError = defaultOnRecoverableError;
	let transitionCallbacks = null;

	if (options !== null && options !== undefined) {
		if (__DEV__) {
			if (options.hydrate) {
				console.warn(
					"hydrate through createRoot is deprecated. Use ReactDOMClient.hydrateRoot(container, <App />) instead."
				);
			} else {
				if (
					typeof options === "object" &&
					options !== null &&
					options.$$typeof === REACT_ELEMENT_TYPE
				) {
					console.error(
						"You passed a JSX element to createRoot. You probably meant to " +
							"call root.render instead. " +
							"Example usage:\n\n" +
							"  let root = createRoot(domContainer);\n" +
							"  root.render(<App />);"
					);
				}
			}
		}
		if (options.unstable_strictMode === true) {
			isStrictMode = true;
		}
		if (
			allowConcurrentByDefault &&
			options.unstable_concurrentUpdatesByDefault === true
		) {
			concurrentUpdatesByDefaultOverride = true;
		}
		if (options.identifierPrefix !== undefined) {
			identifierPrefix = options.identifierPrefix;
		}
		if (options.onRecoverableError !== undefined) {
			onRecoverableError = options.onRecoverableError;
		}
		if (options.transitionCallbacks !== undefined) {
			transitionCallbacks = options.transitionCallbacks;
		}
	}

	/** -
	 * 创建 FiberRoot 和 rootFiber，并让其产生关联
	 * @container div 容器
	 * @ConcurrentRoot 并发模式
	 * @isStrictMode 开发模式下 是否为严格模式
	 * @concurrentUpdatesByDefaultOverride 更新是否默认为覆盖
	 * @identifierPrefix 标识前缀
	 * @onRecoverableError 错误反馈
	 * @transitionCallbacks 动画结束回调
	 */

	const root = createContainer(
		container,
		ConcurrentRoot,
		null,
		isStrictMode,
		concurrentUpdatesByDefaultOverride,
		identifierPrefix,
		onRecoverableError,
		transitionCallbacks
	);

	//- 把dom标志，就是在dom中，添加__reactContainer 的变量，
	markContainerAsRoot(root.current, container);

	const rootContainerElement =
		container.nodeType === COMMENT_NODE ? container.parentNode : container;

	// 添加事件代理
	listenToAllSupportedEvents(rootContainerElement);

	// 创建变量 _internalRoot; 
	return new ReactDOMRoot(root);
}
```

### createContainer

```js
// 创建fiberRoot 和 reactFilber
export function createContainer(
	containerInfo,
	tag,
	hydrationCallbacks,
	isStrictMode,
	concurrentUpdatesByDefaultOverride,
	identifierPrefix,
	onRecoverableError,
	transitionCallbacks
) {
	const hydrate = false;
	const initialChildren = null;
	return createFiberRoot(
		containerInfo,
		tag,
		hydrate,
		initialChildren,
		hydrationCallbacks,
		isStrictMode,
		concurrentUpdatesByDefaultOverride,
		identifierPrefix,
		onRecoverableError,
		transitionCallbacks
	);
}
```

### createFiberRoot

```js
export function createFiberRoot(
	containerInfo,
	tag,
	hydrate,
	initialChildren,
	hydrationCallbacks,
	isStrictMode,
	concurrentUpdatesByDefaultOverride,
	// TODO: We have several of these arguments that are conceptually part of the
	// host config, but because they are passed in at runtime, we have to thread
	// them through the root constructor. Perhaps we should put them all into a
	// single type, like a DynamicHostConfig that is defined by the renderer.
	identifierPrefix,
	onRecoverableError,
	transitionCallbacks
) {
	//- 创建根节点fiberRoot
	const root = new FiberRootNode(
		containerInfo,
		tag,
		hydrate,
		identifierPrefix,
		onRecoverableError
	);
	if (enableSuspenseCallback) {
		root.hydrationCallbacks = hydrationCallbacks;
	}

	if (enableTransitionTracing) {
		root.transitionCallbacks = transitionCallbacks;
	}

	// Cyclic construction. This cheats the type system right now because
	// stateNode is any.

	// 创建根节点对应的RootFiber
	const uninitializedFiber = createHostRootFiber(
		tag,
		isStrictMode,
		concurrentUpdatesByDefaultOverride
	);

	// 确定 fiberRoot 和 rootFiber 的关系
	root.current = uninitializedFiber;
	uninitializedFiber.stateNode = root;

	// 是否开启缓存
	if (enableCache) {
		const initialCache = createCache();
		retainCache(initialCache);

		// The pooledCache is a fresh cache instance that is used temporarily
		// for newly mounted boundaries during a render. In general, the
		// pooledCache is always cleared from the root at the end of a render:
		// it is either released when render commits, or moved to an Offscreen
		// component if rendering suspends. Because the lifetime of the pooled
		// cache is distinct from the main memoizedState.cache, it must be
		// retained separately.
		root.pooledCache = initialCache;
		retainCache(initialCache);
		const initialState = {
			element: initialChildren,
			isDehydrated: hydrate,
			cache: initialCache,
			transitions: null,
			pendingSuspenseBoundaries: null,
		};
		uninitializedFiber.memoizedState = initialState;
	} else {
		const initialState = {
			element: initialChildren,
			isDehydrated: hydrate,
			cache: null, // not enabled yet
			transitions: null,
			pendingSuspenseBoundaries: null,
		};
		uninitializedFiber.memoizedState = initialState;
	}

	//- 初始化更新队列
	initializeUpdateQueue(uninitializedFiber);

	return root;
}
```

### initializeUpdateQueue

```js
export function initializeUpdateQueue(fiber) {
	const queue = {
		baseState: fiber.memoizedState,
		firstBaseUpdate: null,
		lastBaseUpdate: null,
		shared: {
			pending: null,
			interleaved: null,
			lanes: NoLanes,
		},
		effects: null,
	};
	fiber.updateQueue = queue;
}
```

### fiberRootNode

```js
/**
 * @containerInfo div 容器
 * @tag 类型，详看变量模块
 * @hydrate false，服务端才为true
 * @identifierPrefix 唯一前缀
 * @onRecoverableError 错误返回
 */
function FiberRootNode(
	containerInfo,
	tag,
	hydrate,
	identifierPrefix,
	onRecoverableError
) {
	this.tag = tag;
	this.containerInfo = containerInfo;
	this.pendingChildren = null;
	this.current = null;
	this.pingCache = null;
	this.finishedWork = null;
	this.timeoutHandle = noTimeout;
	this.context = null;
	this.pendingContext = null;
	this.callbackNode = null;
	this.callbackPriority = NoLane;
	this.eventTimes = createLaneMap(NoLanes);
	this.expirationTimes = createLaneMap(NoTimestamp);

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

	if (__DEV__) {
		switch (tag) {
			case ConcurrentRoot:
				this._debugRootType = hydrate
					? "hydrateRoot()"
					: "createRoot()";
				break;
			case LegacyRoot:
				this._debugRootType = hydrate ? "hydrate()" : "render()";
				break;
		}
	}
}
```

### markContainerAsRoot

```js
const internalContainerInstanceKey = "__reactContainer$" + randomKey;
export function markContainerAsRoot(hostRoot, node) {
	node[internalContainerInstanceKey] = hostRoot;
}
```

### 挂载 render 和 unmount

```js
ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render =
	function (children) {
		// 获取 FiberRoot containerInfo 就是 div 容器
		const root = this._internalRoot;
		if (root === null) {
			throw new Error("Cannot update an unmounted root.");
		}

		if (__DEV__) {
			if (typeof arguments[1] === "function") {
				console.error(
					"render(...): does not support the second callback argument. " +
						"To execute a side effect after rendering, declare it in a component body with useEffect()."
				);
			} else if (isValidContainer(arguments[1])) {
				console.error(
					"You passed a container to the second argument of root.render(...). " +
						"You don't need to pass it again since you already passed it to create the root."
				);
			} else if (typeof arguments[1] !== "undefined") {
				console.error(
					"You passed a second argument to root.render(...) but it only accepts " +
						"one argument."
				);
			}

			const container = root.containerInfo;

			if (container.nodeType !== COMMENT_NODE) {
				const hostInstance = findHostInstanceWithNoPortals(
					root.current
				);
				if (hostInstance) {
					if (hostInstance.parentNode !== container) {
						console.error(
							"render(...): It looks like the React-rendered content of the " +
								"root container was removed without using React. This is not " +
								"supported and will cause errors. Instead, call " +
								"root.unmount() to empty a root's container."
						);
					}
				}
			}
		}

		// 渲染更新容器
		updateContainer(children, root, null, null);
	};

ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount =
	function () {
		if (__DEV__) {
			if (typeof arguments[0] === "function") {
				console.error(
					"unmount(...): does not support a callback argument. " +
						"To execute a side effect after rendering, declare it in a component body with useEffect()."
				);
			}
		}
		// 获取 fiberRoot
		const root = this._internalRoot;
		if (root !== null) {
			this._internalRoot = null;
			const container = root.containerInfo;
			if (__DEV__) {
				if (isAlreadyRendering()) {
					console.error(
						"Attempted to synchronously unmount a root while React was already " +
							"rendering. React cannot finish unmounting the root until the " +
							"current render has completed, which may lead to a race condition."
					);
				}
			}
			// 清空容器
			flushSync(() => {
				updateContainer(null, root, null, null);
			});
			// 取消标记 容器 div const internalContainerInstanceKey = '__reactContainer$' + randomKey; 
			unmarkContainerAsRoot(container);
		}
	};
```
