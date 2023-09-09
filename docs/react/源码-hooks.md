---
title: React hooks源码
date: 2023-3-11
isShowComments: false
tags:
    - react源码
categories:
    - react源码
---

## hooks 的原理

-   在 renderWithHooks 中，把 workInProgress; 赋值给 currentlyRenderingFiber，然后通过 mountWorkInProgressHook 把所有的 hooks 串联起来，形成单链表结构保存在 memoizedState 中；

```js
if (workInProgressHook === null) {
	// This is the first hook in the list
	currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
} else {
	// Append to the end of the list
	workInProgressHook = workInProgressHook.next = hook;
}
```

-   useEffect 副作用需要特殊处理，形成循环链表，保存在 updateQueue 中

```js
let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
if (componentUpdateQueue === null) {
	componentUpdateQueue = createFunctionComponentUpdateQueue();
	currentlyRenderingFiber.updateQueue = componentUpdateQueue;
	componentUpdateQueue.lastEffect = effect.next = effect;
} else {
	const lastEffect = componentUpdateQueue.lastEffect;
	if (lastEffect === null) {
		componentUpdateQueue.lastEffect = effect.next = effect;
	} else {
		const firstEffect = lastEffect.next;
		lastEffect.next = effect;
		effect.next = firstEffect;
		componentUpdateQueue.lastEffect = effect;
	}
}
```

## mount 阶段 所有的 hooks

```js
HooksDispatcherOnMountInDEV = {
	readContext(context) {
		return readContext(context);
	},
	useCallback(callback, deps) {
		currentHookNameInDev = "useCallback";
		mountHookTypesDev();
		checkDepsAreArrayDev(deps);
		return mountCallback(callback, deps);
	},
	useContext(context) {
		currentHookNameInDev = "useContext";
		mountHookTypesDev();
		return readContext(context);
	},
	useEffect(create, deps) {
		currentHookNameInDev = "useEffect";
		mountHookTypesDev();
		checkDepsAreArrayDev(deps);
		return mountEffect(create, deps);
	},
	useImperativeHandle(ref, create, deps) {
		currentHookNameInDev = "useImperativeHandle";
		mountHookTypesDev();
		checkDepsAreArrayDev(deps);
		return mountImperativeHandle(ref, create, deps);
	},
	useInsertionEffect(create, deps) {
		currentHookNameInDev = "useInsertionEffect";
		mountHookTypesDev();
		checkDepsAreArrayDev(deps);
		return mountInsertionEffect(create, deps);
	},
	useLayoutEffect(create, deps) {
		currentHookNameInDev = "useLayoutEffect";
		mountHookTypesDev();
		checkDepsAreArrayDev(deps);
		return mountLayoutEffect(create, deps);
	},
	useMemo(create, deps) {
		currentHookNameInDev = "useMemo";
		mountHookTypesDev();
		checkDepsAreArrayDev(deps);
		const prevDispatcher = ReactCurrentDispatcher.current;
		ReactCurrentDispatcher.current =
			InvalidNestedHooksDispatcherOnMountInDEV;
		try {
			return mountMemo(create, deps);
		} finally {
			ReactCurrentDispatcher.current = prevDispatcher;
		}
	},
	useReducer(reducer, initialArg, init) {
		currentHookNameInDev = "useReducer";
		mountHookTypesDev();
		const prevDispatcher = ReactCurrentDispatcher.current;
		ReactCurrentDispatcher.current =
			InvalidNestedHooksDispatcherOnMountInDEV;
		try {
			return mountReducer(reducer, initialArg, init);
		} finally {
			ReactCurrentDispatcher.current = prevDispatcher;
		}
	},
	useRef(initialValue) {
		currentHookNameInDev = "useRef";
		mountHookTypesDev();
		return mountRef(initialValue);
	},
	useState(initialState) {
		currentHookNameInDev = "useState";
		mountHookTypesDev();
		const prevDispatcher = ReactCurrentDispatcher.current;
		ReactCurrentDispatcher.current =
			InvalidNestedHooksDispatcherOnMountInDEV;
		try {
			return mountState(initialState);
		} finally {
			ReactCurrentDispatcher.current = prevDispatcher;
		}
	},
	useDebugValue(value, formatterFn) {
		currentHookNameInDev = "useDebugValue";
		mountHookTypesDev();
		return mountDebugValue(value, formatterFn);
	},
	useDeferredValue(value) {
		currentHookNameInDev = "useDeferredValue";
		mountHookTypesDev();
		return mountDeferredValue(value);
	},
	useTransition() {
		currentHookNameInDev = "useTransition";
		mountHookTypesDev();
		return mountTransition();
	},
	useMutableSource(source, getSnapshot, subscribe) {
		currentHookNameInDev = "useMutableSource";
		mountHookTypesDev();
		return mountMutableSource(source, getSnapshot, subscribe);
	},
	useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
		currentHookNameInDev = "useSyncExternalStore";
		mountHookTypesDev();
		return mountSyncExternalStore(
			subscribe,
			getSnapshot,
			getServerSnapshot
		);
	},
	useId() {
		currentHookNameInDev = "useId";
		mountHookTypesDev();
		return mountId();
	},

	unstable_isNewReconciler: enableNewReconciler,
};
```

## update 阶段 所有的 hooks

```js
HooksDispatcherOnUpdateInDEV = {
	readContext(context) {
		return readContext(context);
	},
	useCallback(callback, deps) {
		currentHookNameInDev = "useCallback";
		updateHookTypesDev();
		return updateCallback(callback, deps);
	},
	useContext(context) {
		currentHookNameInDev = "useContext";
		updateHookTypesDev();
		return readContext(context);
	},
	useEffect(create, deps) {
		currentHookNameInDev = "useEffect";
		updateHookTypesDev();
		return updateEffect(create, deps);
	},
	useImperativeHandle(ref, create, deps) {
		currentHookNameInDev = "useImperativeHandle";
		updateHookTypesDev();
		return updateImperativeHandle(ref, create, deps);
	},
	useInsertionEffect(create, deps) {
		currentHookNameInDev = "useInsertionEffect";
		updateHookTypesDev();
		return updateInsertionEffect(create, deps);
	},
	useLayoutEffect(create, deps) {
		currentHookNameInDev = "useLayoutEffect";
		updateHookTypesDev();
		return updateLayoutEffect(create, deps);
	},
	useMemo(create, deps) {
		currentHookNameInDev = "useMemo";
		updateHookTypesDev();
		const prevDispatcher = ReactCurrentDispatcher.current;
		ReactCurrentDispatcher.current =
			InvalidNestedHooksDispatcherOnUpdateInDEV;
		try {
			return updateMemo(create, deps);
		} finally {
			ReactCurrentDispatcher.current = prevDispatcher;
		}
	},
	useReducer(reducer, initialArg, init) {
		currentHookNameInDev = "useReducer";
		updateHookTypesDev();
		const prevDispatcher = ReactCurrentDispatcher.current;
		ReactCurrentDispatcher.current =
			InvalidNestedHooksDispatcherOnUpdateInDEV;
		try {
			return updateReducer(reducer, initialArg, init);
		} finally {
			ReactCurrentDispatcher.current = prevDispatcher;
		}
	},
	useRef(initialValue) {
		currentHookNameInDev = "useRef";
		updateHookTypesDev();
		return updateRef(initialValue);
	},
	useState(initialState) {
		currentHookNameInDev = "useState";
		updateHookTypesDev();
		const prevDispatcher = ReactCurrentDispatcher.current;
		ReactCurrentDispatcher.current =
			InvalidNestedHooksDispatcherOnUpdateInDEV;
		try {
			return updateState(initialState);
		} finally {
			ReactCurrentDispatcher.current = prevDispatcher;
		}
	},
	useDebugValue(value, formatterFn) {
		currentHookNameInDev = "useDebugValue";
		updateHookTypesDev();
		return updateDebugValue(value, formatterFn);
	},
	useDeferredValue(value) {
		currentHookNameInDev = "useDeferredValue";
		updateHookTypesDev();
		return updateDeferredValue(value);
	},
	useTransition() {
		currentHookNameInDev = "useTransition";
		updateHookTypesDev();
		return updateTransition();
	},
	useMutableSource(source, getSnapshot, subscribe) {
		currentHookNameInDev = "useMutableSource";
		updateHookTypesDev();
		return updateMutableSource(source, getSnapshot, subscribe);
	},
	useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
		currentHookNameInDev = "useSyncExternalStore";
		updateHookTypesDev();
		return updateSyncExternalStore(
			subscribe,
			getSnapshot,
			getServerSnapshot
		);
	},
	useId() {
		currentHookNameInDev = "useId";
		updateHookTypesDev();
		return updateId();
	},

	unstable_isNewReconciler: enableNewReconciler,
};
```

### resolveDispatcher

-   统一调用 resolveDispatcher 获取所有的方法

```js
function resolveDispatcher() {
	const dispatcher = ReactCurrentDispatcher.current;

	// Will result in a null access error if accessed outside render phase. We
	// intentionally don't throw our own error because this is in a hot path.
	// Also helps ensure this is inlined.
	return dispatcher;
}
```

### mountWorkInProgressHook

-   第一次渲染都要经过**mountWorkInProgressHook** 方法，创建链表。

```js
function mountWorkInProgressHook() {
	const hook = {
		memoizedState: null,

		baseState: null,
		baseQueue: null,
		queue: null,

		next: null,
	};

	if (workInProgressHook === null) {
		// This is the first hook in the list
		currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
	} else {
		// Append to the end of the list
		workInProgressHook = workInProgressHook.next = hook;
	}
	return workInProgressHook;
}
```

### mountState

-   useState 第一次渲染统一经过 mountState

```js
function mountState(initialState) {
	// 获取当前fiber 的链表
	const hook = mountWorkInProgressHook();
	if (typeof initialState === "function") {
		// $FlowFixMe: Flow doesn't like mixed types
		initialState = initialState();
	}
	// 初始值赋值
	hook.memoizedState = hook.baseState = initialState;
	const queue = {
		pending: null,
		interleaved: null,
		lanes: NoLanes,
		dispatch: null,
		lastRenderedReducer: basicStateReducer,
		lastRenderedState: initialState,
	};
	hook.queue = queue;
	const dispatch = (queue.dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		queue
	));
	return [hook.memoizedState, dispatch];
}
```

### mountRef

```js
function mountRef(initialValue) {
	const hook = mountWorkInProgressHook();
	const ref = { current: initialValue };
	hook.memoizedState = ref;
	return ref;
}
```

### mountMemo

```js
function mountMemo(nextCreate, deps) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const nextValue = nextCreate();
	hook.memoizedState = [nextValue, nextDeps];
	return nextValue;
}
```

### mountCallback

```js
function mountCallback(callback, deps) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	hook.memoizedState = [callback, nextDeps];
	return callback;
}
```

### mountEffect

```js
function mountEffect(create, deps) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	currentlyRenderingFiber.flags |= fiberFlags;
	hook.memoizedState = pushEffect(
		HookHasEffect | hookFlags,
		create,
		undefined,
		nextDeps
	);
}
```

### pushEffect

```js
function pushEffect(tag, create, destroy, deps) {
	const effect = {
		tag,
		create,
		destroy,
		deps,
		// Circular
		next: null,
	};
	let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
	if (componentUpdateQueue === null) {
		componentUpdateQueue = createFunctionComponentUpdateQueue();
		currentlyRenderingFiber.updateQueue = componentUpdateQueue;
		componentUpdateQueue.lastEffect = effect.next = effect;
	} else {
		const lastEffect = componentUpdateQueue.lastEffect;
		if (lastEffect === null) {
			componentUpdateQueue.lastEffect = effect.next = effect;
		} else {
			const firstEffect = lastEffect.next;
			lastEffect.next = effect;
			effect.next = firstEffect;
			componentUpdateQueue.lastEffect = effect;
		}
	}
	return effect;
}
```

## updateWorkInProgressHook

```js
function updateWorkInProgressHook() {
	// This function is used both for updates and for re-renders triggered by a
	// render phase update. It assumes there is either a current hook we can
	// clone, or a work-in-progress hook from a previous render pass that we can
	// use as a base. When we reach the end of the base list, we must switch to
	// the dispatcher used for mounts.
	let nextCurrentHook;
	if (currentHook === null) {
		const current = currentlyRenderingFiber.alternate;
		if (current !== null) {
			nextCurrentHook = current.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		nextCurrentHook = currentHook.next;
	}

	let nextWorkInProgressHook;
	if (workInProgressHook === null) {
		nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
	} else {
		nextWorkInProgressHook = workInProgressHook.next;
	}

	if (nextWorkInProgressHook !== null) {
		// There's already a work-in-progress. Reuse it.
		workInProgressHook = nextWorkInProgressHook;
		nextWorkInProgressHook = workInProgressHook.next;

		currentHook = nextCurrentHook;
	} else {
		// Clone from the current hook.

		if (nextCurrentHook === null) {
			throw new Error(
				"Rendered more hooks than during the previous render."
			);
		}

		currentHook = nextCurrentHook;

		const newHook = {
			memoizedState: currentHook.memoizedState,

			baseState: currentHook.baseState,
			baseQueue: currentHook.baseQueue,
			queue: currentHook.queue,

			next: null,
		};

		if (workInProgressHook === null) {
			// This is the first hook in the list.
			currentlyRenderingFiber.memoizedState = workInProgressHook =
				newHook;
		} else {
			// Append to the end of the list.
			workInProgressHook = workInProgressHook.next = newHook;
		}
	}
	return workInProgressHook;
}
```

### updateReducer

```js
function updateReducer(reducer, initialArg, init) {
	const hook = updateWorkInProgressHook();
	const queue = hook.queue;

	if (queue === null) {
		throw new Error(
			"Should have a queue. This is likely a bug in React. Please file an issue."
		);
	}

	queue.lastRenderedReducer = reducer;

	const current = currentHook;

	// The last rebase update that is NOT part of the base state.
	let baseQueue = current.baseQueue;

	// The last pending update that hasn't been processed yet.
	const pendingQueue = queue.pending;
	if (pendingQueue !== null) {
		// We have new updates that haven't been processed yet.
		// We'll add them to the base queue.
		if (baseQueue !== null) {
			// Merge the pending queue and the base queue.
			const baseFirst = baseQueue.next;
			const pendingFirst = pendingQueue.next;
			baseQueue.next = pendingFirst;
			pendingQueue.next = baseFirst;
		}
		current.baseQueue = baseQueue = pendingQueue;
		queue.pending = null;
	}

	if (baseQueue !== null) {
		// We have a queue to process.
		const first = baseQueue.next;
		let newState = current.baseState;

		let newBaseState = null;
		let newBaseQueueFirst = null;
		let newBaseQueueLast = null;
		let update = first;
		do {
			const updateLane = update.lane;
			if (!isSubsetOfLanes(renderLanes, updateLane)) {
				// Priority is insufficient. Skip this update. If this is the first
				// skipped update, the previous update/state is the new base
				// update/state.
				const clone = {
					lane: updateLane,
					action: update.action,
					hasEagerState: update.hasEagerState,
					eagerState: update.eagerState,
					next: null,
				};
				if (newBaseQueueLast === null) {
					newBaseQueueFirst = newBaseQueueLast = clone;
					newBaseState = newState;
				} else {
					newBaseQueueLast = newBaseQueueLast.next = clone;
				}
				// Update the remaining priority in the queue.
				// TODO: Don't need to accumulate this. Instead, we can remove
				// renderLanes from the original lanes.
				currentlyRenderingFiber.lanes = mergeLanes(
					currentlyRenderingFiber.lanes,
					updateLane
				);
				markSkippedUpdateLanes(updateLane);
			} else {
				// This update does have sufficient priority.

				if (newBaseQueueLast !== null) {
					const clone = {
						// This update is going to be committed so we never want uncommit
						// it. Using NoLane works because 0 is a subset of all bitmasks, so
						// this will never be skipped by the check above.
						lane: NoLane,
						action: update.action,
						hasEagerState: update.hasEagerState,
						eagerState: update.eagerState,
						next: null,
					};
					newBaseQueueLast = newBaseQueueLast.next = clone;
				}

				// Process this update.
				if (update.hasEagerState) {
					// If this update is a state update (not a reducer) and was processed eagerly,
					// we can use the eagerly computed state
					newState = update.eagerState;
				} else {
					const action = update.action;
					newState = reducer(newState, action);
				}
			}
			update = update.next;
		} while (update !== null && update !== first);

		if (newBaseQueueLast === null) {
			newBaseState = newState;
		} else {
			newBaseQueueLast.next = newBaseQueueFirst;
		}

		// Mark that the fiber performed work, but only if the new state is
		// different from the current state.
		if (!is(newState, hook.memoizedState)) {
			markWorkInProgressReceivedUpdate();
		}

		hook.memoizedState = newState;
		hook.baseState = newBaseState;
		hook.baseQueue = newBaseQueueLast;

		queue.lastRenderedState = newState;
	}

	// Interleaved updates are stored on a separate queue. We aren't going to
	// process them during this render, but we do need to track which lanes
	// are remaining.
	const lastInterleaved = queue.interleaved;
	if (lastInterleaved !== null) {
		let interleaved = lastInterleaved;
		do {
			const interleavedLane = interleaved.lane;
			currentlyRenderingFiber.lanes = mergeLanes(
				currentlyRenderingFiber.lanes,
				interleavedLane
			);
			markSkippedUpdateLanes(interleavedLane);
			interleaved = interleaved.next;
		} while (interleaved !== lastInterleaved);
	} else if (baseQueue === null) {
		// `queue.lanes` is used for entangling transitions. We can set it back to
		// zero once the queue is empty.
		queue.lanes = NoLanes;
	}

	const dispatch = queue.dispatch;
	return [hook.memoizedState, dispatch];
}
```

### updateRef

```js
function updateRef(initialValue) {
	const hook = updateWorkInProgressHook();
	return hook.memoizedState;
}
```

### updateMemo

```js
function updateMemo(nextCreate, deps) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const prevState = hook.memoizedState;
	if (prevState !== null) {
		// Assume these are defined. If they're not, areHookInputsEqual will warn.
		if (nextDeps !== null) {
			const prevDeps = prevState[1];
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				return prevState[0];
			}
		}
	}
	const nextValue = nextCreate();
	hook.memoizedState = [nextValue, nextDeps];
	return nextValue;
}
```

### updateCallback

```js
function updateCallback(callback, deps) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const prevState = hook.memoizedState;
	if (prevState !== null) {
		if (nextDeps !== null) {
			const prevDeps = prevState[1];
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				return prevState[0];
			}
		}
	}
	hook.memoizedState = [callback, nextDeps];
	return callback;
}
```

### updateEffect

```js
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	let destroy = undefined;

	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState;
		destroy = prevEffect.destroy;
		if (nextDeps !== null) {
			const prevDeps = prevEffect.deps;
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				hook.memoizedState = pushEffect(
					hookFlags,
					create,
					destroy,
					nextDeps
				);
				return;
			}
		}
	}

	currentlyRenderingFiber.flags |= fiberFlags;

	hook.memoizedState = pushEffect(
		HookHasEffect | hookFlags,
		create,
		destroy,
		nextDeps
	);
}
```
