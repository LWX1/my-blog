---
title: React render
date: 2023-3-11
isShowComments: false
tags:
    - react源码
categories:
    - react源码
---

### render

- 获取当前fiber 时间和优先级
- 通过getContextForSubtree 传递context
- createUpdate 创建更新update ， payload 中保存子节点的数据
- enqueueUpdate 更新队列，队列存储在fiber 的updateQueue 中
- markUpdateLaneFromFiberToRoot 将当前节点的所有上级节点赋值lane 优先级，并返回fiberRoot 
- ensureRootIsScheduled 获取最高优先级任务对比，确保调度优先级，并通过port.postMessage 调度任务
- workLoop 递归调用，构建fiber树
- performConcurrentWorkOnRoot 中判断空余时间，情况副作用
- renderRootSync 中prepareFreshStack 创建rootWorkInProgress 树和workInProgressRoot，即fiberRoot 和 rootFiber，workInProgress 也为 rootWorkInProgress
- workLoopSync 构建workInProgress，通过performUnitOfWork 中unitOfWork（workInProgree）树和 current 树（workInProgress.alternate === current），在beginWork 中 current.memoizedProps 和 workInProgress.pendingProps 进行对比，是否应该更新，用didReceiveUpdate 变量进行记录，通过processUpdateQueue 方法更新状态；completeUnitOfWork 当没有子节点，则完成当前fiber。


```js
ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render =
	function (children) {
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
		//- 更新容器
		updateContainer(children, root, null, null);
	};
```

### updateContainer

```js
/**
 * @element 容器中的 children
 * @container 容器 fiberRoot 对象
 * @parentComponent 父亲组件，一般为 null
 * @callback 回调函数，一般也为 null
 */
export function updateContainer(element, container, parentComponent, callback) {
	if (__DEV__) {
		onScheduleRoot(container, element);
	}
	// rootFiber
	const current = container.current;
	// 获取当前时间
	const eventTime = requestEventTime();
	// 获取更新的优先级
	const lane = requestUpdateLane(current);

	if (enableSchedulingProfiler) {
		// 标记渲染的优先级
		markRenderScheduled(lane);
	}
	// 传递context，parentComponent 初次一般为null 返回空对象
	const context = getContextForSubtree(parentComponent);
	// 获取 context 的值
	if (container.context === null) {
		container.context = context;
	} else {
		container.pendingContext = context;
	}

	if (__DEV__) {
		if (
			ReactCurrentFiberIsRendering &&
			ReactCurrentFiberCurrent !== null &&
			!didWarnAboutNestedUpdates
		) {
			didWarnAboutNestedUpdates = true;
			console.error(
				"Render methods should be a pure function of props and state; " +
					"triggering nested component updates from render is not allowed. " +
					"If necessary, trigger nested updates in componentDidUpdate.\n\n" +
					"Check the render method of %s.",
				getComponentNameFromFiber(ReactCurrentFiberCurrent) || "Unknown"
			);
		}
	}

	// 创建更新对象
	const update = createUpdate(eventTime, lane);
	// Caution: React DevTools currently depends on this property
	// being called "element".
	// 保存 children 到 payload 中
	update.payload = { element };

	callback = callback === undefined ? null : callback;
	if (callback !== null) {
		if (__DEV__) {
			if (typeof callback !== "function") {
				console.error(
					"render(...): Expected the last optional `callback` argument to be a " +
						"function. Instead received: %s.",
					callback
				);
			}
		}
		// 更新回调
		update.callback = callback;
	}

	//- 队列更新
	const root = enqueueUpdate(current, update, lane);
	if (root !== null) {
		scheduleUpdateOnFiber(root, current, lane, eventTime);
		entangleTransitions(root, current, lane);
	}

	return lane;
}
```

### enqueueUpdate

```js
/**
 * @fiber 当前fiber
 * @update 更新的队列
 * @lane 优先级
 * 
 */
export function enqueueUpdate(fiber, update, lane) {
	const updateQueue = fiber.updateQueue;
	if (updateQueue === null) {
		// Only occurs if the fiber has been unmounted.
		return null;
	}

	const sharedQueue = updateQueue.shared;

	if (__DEV__) {
		if (
			currentlyProcessingQueue === sharedQueue &&
			!didWarnUpdateInsideUpdate
		) {
			console.error(
				"An update (setState, replaceState, or forceUpdate) was scheduled " +
					"from inside an update function. Update functions should be pure, " +
					"with zero side-effects. Consider using componentDidUpdate or a " +
					"callback."
			);
			didWarnUpdateInsideUpdate = true;
		}
	}

	if (isUnsafeClassRenderPhaseUpdate(fiber)) {
		// This is an unsafe render phase update. Add directly to the update
		// queue so we can process it immediately during the current render.
		const pending = sharedQueue.pending;
		if (pending === null) {
			// This is the first update. Create a circular list.
			update.next = update;
		} else {
			update.next = pending.next;
			pending.next = update;
		}
		sharedQueue.pending = update;

		// Update the childLanes even though we're most likely already rendering
		// this fiber. This is for backwards compatibility in the case where you
		// update a different component during render phase than the one that is
		// currently renderings (a pattern that is accompanied by a warning).
		return unsafe_markUpdateLaneFromFiberToRoot(fiber, lane);
	} else {
		//- 创建链表
		return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
	}
}
```

### enqueueConcurrentClassUpdate

```js
/**
 * @fiber
 * @queue 更新队列 queue.interleaved = update;
 * @update 更新循环链表
 * @lane 优先级
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
	const interleaved = queue.interleaved;
	if (interleaved === null) {
		// This is the first update. Create a circular list.
		// 创建循环链表
		update.next = update;
		// At the end of the current render, this queue's interleaved updates will
		// be transferred to the pending queue.
		// 把queue 放入全局变量 concurrentQueues 中
		pushConcurrentUpdateQueue(queue);
	} else {
		update.next = interleaved.next;
		interleaved.next = update;
	}
	queue.interleaved = update;
	// 更新每个孩子的优先级
	return markUpdateLaneFromFiberToRoot(fiber, lane);
}
```

### markUpdateLaneFromFiberToRoot

```js
function markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
	// Update the source fiber's lanes
	sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
	let alternate = sourceFiber.alternate;
	if (alternate !== null) {
		alternate.lanes = mergeLanes(alternate.lanes, lane);
	}
	if (__DEV__) {
		if (
			alternate === null &&
			(sourceFiber.flags & (Placement | Hydrating)) !== NoFlags
		) {
			warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
		}
	}
	// Walk the parent path to the root and update the child lanes.
	let node = sourceFiber;
	let parent = sourceFiber.return;
	while (parent !== null) {
		parent.childLanes = mergeLanes(parent.childLanes, lane);
		alternate = parent.alternate;
		if (alternate !== null) {
			alternate.childLanes = mergeLanes(alternate.childLanes, lane);
		} else {
			if (__DEV__) {
				if ((parent.flags & (Placement | Hydrating)) !== NoFlags) {
					warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
				}
			}
		}
		node = parent;
		parent = parent.return;
	}
	if (node.tag === HostRoot) {
		const root = node.stateNode;
		return root;
	} else {
		return null;
	}
}
```

### scheduleUpdateOnFiber

```js
/**
 * @root fiberRoot
 * @fiber rootFiber
 * @lane 优先级
 * @eventTime 渲染时间
 */
export function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
	// 检测是否进入无限循环，标记常量 50
	checkForNestedUpdates();

	if (__DEV__) {
		if (isRunningInsertionEffect) {
			console.error("useInsertionEffect must not schedule updates.");
		}
	}

	if (__DEV__) {
		if (isFlushingPassiveEffects) {
			didScheduleUpdateDuringPassiveEffects = true;
		}
	}

	// Mark that the root has a pending update.
	// 标记 fiberRoot 渲染的更新时间
	markRootUpdated(root, lane, eventTime);

	// 判断是否有任务正在渲染，有则进入
	if (
		(executionContext & RenderContext) !== NoLanes &&
		root === workInProgressRoot
	) {
		// This update was dispatched during the render phase. This is a mistake
		// if the update originates from user space (with the exception of local
		// hook updates, which are handled differently and don't reach this
		// function), but there are some internal React features that use this as
		// an implementation detail, like selective hydration.
		warnAboutRenderPhaseUpdatesInDEV(fiber);

		// Track lanes that were updated during the render phase
		workInProgressRootRenderPhaseUpdatedLanes = mergeLanes(
			workInProgressRootRenderPhaseUpdatedLanes,
			lane
		);
	} else {
		// This is a normal update, scheduled from outside the render phase. For
		// example, during an input event.
		if (enableUpdaterTracking) {
			if (isDevToolsPresent) {
				// 添加 fiber 优先级到 map 中
				addFiberToLanesMap(root, fiber, lane);
			}
		}

		warnIfUpdatesNotWrappedWithActDEV(fiber);

		if (enableProfilerTimer && enableProfilerNestedUpdateScheduledHook) {
			if (
				// 判断是否有任务在提交，有则进入
				(executionContext & CommitContext) !== NoContext &&
				root === rootCommittingMutationOrLayoutEffects
			) {
				if (fiber.mode & ProfileMode) {
					let current = fiber;
					while (current !== null) {
						if (current.tag === Profiler) {
							const { id, onNestedUpdateScheduled } =
								current.memoizedProps;
							if (typeof onNestedUpdateScheduled === "function") {
								onNestedUpdateScheduled(id);
							}
						}
						current = current.return;
					}
				}
			}
		}

		if (enableTransitionTracing) {
			const transition = ReactCurrentBatchConfig.transition;
			if (transition !== null) {
				if (transition.startTime === -1) {
					transition.startTime = now();
				}

				addTransitionToLanesMap(root, transition, lane);
			}
		}
		// 初次渲染不进入
		if (root === workInProgressRoot) {
			// Received an update to a tree that's in the middle of rendering. Mark
			// that there was an interleaved update work on this root. Unless the
			// `deferRenderPhaseUpdateToNextBatch` flag is off and this is a render
			// phase update. In that case, we don't treat render phase updates as if
			// they were interleaved, for backwards compat reasons.
			if (
				deferRenderPhaseUpdateToNextBatch ||
				(executionContext & RenderContext) === NoContext
			) {
				workInProgressRootInterleavedUpdatedLanes = mergeLanes(
					workInProgressRootInterleavedUpdatedLanes,
					lane
				);
			}
			if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
				// The root already suspended with a delay, which means this render
				// definitely won't finish. Since we have a new update, let's mark it as
				// suspended now, right before marking the incoming update. This has the
				// effect of interrupting the current render and switching to the update.
				// TODO: Make sure this doesn't override pings that happen while we've
				// already started rendering.
				markRootSuspended(root, workInProgressRootRenderLanes);
			}
		}
		//- fiberRoot 进入调度
		ensureRootIsScheduled(root, eventTime);
		if (
			lane === SyncLane &&
			executionContext === NoContext &&
			(fiber.mode & ConcurrentMode) === NoMode &&
			// Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
			!(__DEV__ && ReactCurrentActQueue.isBatchingLegacy)
		) {
			// Flush the synchronous work now, unless we're already working or inside
			// a batch. This is intentionally inside scheduleUpdateOnFiber instead of
			// scheduleCallbackForFiber to preserve the ability to schedule a callback
			// without immediately flushing it. We only do this for user-initiated
			// updates, to preserve historical behavior of legacy mode.
			resetRenderTimer();
			flushSyncCallbacksOnlyInLegacyMode();
		}
	}
}
```

### ensureRootIsScheduled

```js
// Use this function to schedule a task for a root. There's only one task per
// root; if a task was already scheduled, we'll check to make sure the priority
// of the existing task is the same as the priority of the next level that the
// root has work on. This function is called on every update, and right before
// exiting a task.
// 再次确保任务优先级，更新高优先级任务
function ensureRootIsScheduled(root, currentTime) {
	// 获取存在的任务回调
	const existingCallbackNode = root.callbackNode;

	// Check if any lanes are being starved by other work. If so, mark them as
	// expired so we know to work on those next.
	// 在工作之前标签优先级任务
	markStarvedLanesAsExpired(root, currentTime);

	// Determine the next lanes to work on, and their priority.
	// 获取下个优先级
	const nextLanes = getNextLanes(
		root,
		root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
	);

	if (nextLanes === NoLanes) {
		// Special case: There's nothing to work on.
		if (existingCallbackNode !== null) {
			cancelCallback(existingCallbackNode);
		}
		root.callbackNode = null;
		root.callbackPriority = NoLane;
		return;
	}

	// We use the highest priority lane to represent the priority of the callback.
	// 获取最高优先级任务
	const newCallbackPriority = getHighestPriorityLane(nextLanes);

	// Check if there's an existing task. We may be able to reuse it.
	// 是否有任务回调
	const existingCallbackPriority = root.callbackPriority;
	if (
		existingCallbackPriority === newCallbackPriority &&
		// Special case related to `act`. If the currently scheduled task is a
		// Scheduler task, rather than an `act` task, cancel it and re-scheduled
		// on the `act` queue.
		!(
			__DEV__ &&
			ReactCurrentActQueue.current !== null &&
			existingCallbackNode !== fakeActCallbackNode
		)
	) {
		if (__DEV__) {
			// If we're going to re-use an existing task, it needs to exist.
			// Assume that discrete update microtasks are non-cancellable and null.
			// TODO: Temporary until we confirm this warning is not fired.
			if (
				existingCallbackNode == null &&
				existingCallbackPriority !== SyncLane
			) {
				console.error(
					"Expected scheduled callback to exist. This error is likely caused by a bug in React. Please file an issue."
				);
			}
		}
		// The priority hasn't changed. We can reuse the existing task. Exit.
		return;
	}

	// 存在任务回调则需要取消
	if (existingCallbackNode != null) {
		// Cancel the existing callback. We'll schedule a new one below.
		cancelCallback(existingCallbackNode);
	}

	// Schedule a new callback.
	// 定义新的任务回调
	let newCallbackNode;
	// 是否为同步任务
	if (newCallbackPriority === SyncLane) {
		// Special case: Sync React callbacks are scheduled on a special
		// internal queue
		if (root.tag === LegacyRoot) {
			if (__DEV__ && ReactCurrentActQueue.isBatchingLegacy !== null) {
				ReactCurrentActQueue.didScheduleLegacyUpdate = true;
			}
			scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root));
		} else {
			scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
		}
		if (supportsMicrotasks) {
			// Flush the queue in a microtask.
			if (__DEV__ && ReactCurrentActQueue.current !== null) {
				// Inside `act`, use our internal `act` queue so that these get flushed
				// at the end of the current scope even when using the sync version
				// of `act`.
				ReactCurrentActQueue.current.push(flushSyncCallbacks);
			} else {
				scheduleMicrotask(() => {
					// In Safari, appending an iframe forces microtasks to run.
					// https://github.com/facebook/react/issues/22459
					// We don't support running callbacks in the middle of render
					// or commit so we need to check against that.
					if (
						(executionContext & (RenderContext | CommitContext)) ===
						NoContext
					) {
						// Note that this would still prematurely flush the callbacks
						// if this happens outside render or commit phase (e.g. in an event).
						flushSyncCallbacks();
					}
				});
			}
		} else {
			// Flush the queue in an Immediate task.
			scheduleCallback(ImmediateSchedulerPriority, flushSyncCallbacks);
		}
		newCallbackNode = null;
	} else {
		let schedulerPriorityLevel;
		switch (lanesToEventPriority(nextLanes)) {
			case DiscreteEventPriority:
				schedulerPriorityLevel = ImmediateSchedulerPriority;
				break;
			case ContinuousEventPriority:
				schedulerPriorityLevel = UserBlockingSchedulerPriority;
				break;
			case DefaultEventPriority:
				schedulerPriorityLevel = NormalSchedulerPriority;
				break;
			case IdleEventPriority:
				schedulerPriorityLevel = IdleSchedulerPriority;
				break;
			default:
				schedulerPriorityLevel = NormalSchedulerPriority;
				break;
		}
		// 任务调度
		newCallbackNode = scheduleCallback(
			schedulerPriorityLevel,
			performConcurrentWorkOnRoot.bind(null, root)
		);
	}

	root.callbackPriority = newCallbackPriority;
	root.callbackNode = newCallbackNode;
}
```

### scheduleCallback = Scheduler_scheduleCallback

```js
function unstable_scheduleCallback(priorityLevel, callback, options) {
	// 当前时间
	var currentTime = getCurrentTime();

	var startTime;
	if (typeof options === "object" && options !== null) {
		var delay = options.delay;
		if (typeof delay === "number" && delay > 0) {
			startTime = currentTime + delay;
		} else {
			startTime = currentTime;
		}
	} else {
		startTime = currentTime;
	}

	var timeout;
	// 优先级
	switch (priorityLevel) {
		case ImmediatePriority:
			timeout = IMMEDIATE_PRIORITY_TIMEOUT;
			break;
		case UserBlockingPriority:
			timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
			break;
		case IdlePriority:
			timeout = IDLE_PRIORITY_TIMEOUT;
			break;
		case LowPriority:
			timeout = LOW_PRIORITY_TIMEOUT;
			break;
		case NormalPriority:
		default:
			timeout = NORMAL_PRIORITY_TIMEOUT;
			break;
	}

	var expirationTime = startTime + timeout;

	// 任务队列
	var newTask = {
		id: taskIdCounter++,
		callback,
		priorityLevel,
		startTime,
		expirationTime,
		sortIndex: -1,
	};
	if (enableProfiling) {
		newTask.isQueued = false;
	}

	if (startTime > currentTime) {
		// This is a delayed task.
		newTask.sortIndex = startTime;
		push(timerQueue, newTask);
		if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
			// All tasks are delayed, and this is the task with the earliest delay.
			if (isHostTimeoutScheduled) {
				// Cancel an existing timeout.
				cancelHostTimeout();
			} else {
				isHostTimeoutScheduled = true;
			}
			// Schedule a timeout.
			requestHostTimeout(handleTimeout, startTime - currentTime);
		}
	} else {
		newTask.sortIndex = expirationTime;
		push(taskQueue, newTask);
		if (enableProfiling) {
			markTaskStart(newTask, currentTime);
			newTask.isQueued = true;
		}
		// Schedule a host callback, if needed. If we're already performing work,
		// wait until the next time we yield.
		if (!isHostCallbackScheduled && !isPerformingWork) {
			isHostCallbackScheduled = true;
			requestHostCallback(flushWork);
		}
	}

	return newTask;
}
```

### flushWork

```js
function flushWork(hasTimeRemaining, initialTime) {
	if (enableProfiling) {
		markSchedulerUnsuspended(initialTime);
	}

	// We'll need a host callback the next time work is scheduled.
	isHostCallbackScheduled = false;
	// 时间片已经使用完
	if (isHostTimeoutScheduled) {
		// We scheduled a timeout but it's no longer needed. Cancel it.
		isHostTimeoutScheduled = false;
		cancelHostTimeout();
	}

	isPerformingWork = true;
	const previousPriorityLevel = currentPriorityLevel;
	try {
		if (enableProfiling) {
			try {
				// 开始循环调度。构建fiber
				return workLoop(hasTimeRemaining, initialTime);
			} catch (error) {
				if (currentTask !== null) {
					const currentTime = getCurrentTime();
					markTaskErrored(currentTask, currentTime);
					currentTask.isQueued = false;
				}
				throw error;
			}
		} else {
			// No catch in prod code path.
			// 开始循环调度。构建fiber
			return workLoop(hasTimeRemaining, initialTime);
		}
	} finally {
		currentTask = null;
		currentPriorityLevel = previousPriorityLevel;
		isPerformingWork = false;
		if (enableProfiling) {
			const currentTime = getCurrentTime();
			markSchedulerSuspended(currentTime);
		}
	}
}
```

### workLoop

```js
function workLoop(hasTimeRemaining, initialTime) {
	let currentTime = initialTime;
	advanceTimers(currentTime);
	// 获取当前任务
	currentTask = peek(taskQueue);
	while (
		currentTask !== null &&
		!(enableSchedulerDebugging && isSchedulerPaused)
	) {
		if (
			currentTask.expirationTime > currentTime &&
			(!hasTimeRemaining || shouldYieldToHost())
		) {
			// This currentTask hasn't expired, and we've reached the deadline.
			break;
		}
		const callback = currentTask.callback;
		if (typeof callback === "function") {
			currentTask.callback = null;
			currentPriorityLevel = currentTask.priorityLevel;
			const didUserCallbackTimeout =
				currentTask.expirationTime <= currentTime;
			if (enableProfiling) {
				markTaskRun(currentTask, currentTime);
			}
			const continuationCallback = callback(didUserCallbackTimeout);
			currentTime = getCurrentTime();
			if (typeof continuationCallback === "function") {
				currentTask.callback = continuationCallback;
				if (enableProfiling) {
					markTaskYield(currentTask, currentTime);
				}
			} else {
				if (enableProfiling) {
					markTaskCompleted(currentTask, currentTime);
					currentTask.isQueued = false;
				}
				if (currentTask === peek(taskQueue)) {
					pop(taskQueue);
				}
			}
			advanceTimers(currentTime);
		} else {
			pop(taskQueue);
		}
		currentTask = peek(taskQueue);
	}
	// Return whether there's additional work
	if (currentTask !== null) {
		return true;
	} else {
		const firstTimer = peek(timerQueue);
		if (firstTimer !== null) {
			requestHostTimeout(
				handleTimeout,
				firstTimer.startTime - currentTime
			);
		}
		return false;
	}
}
```

### performConcurrentWorkOnRoot

```js
// This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.
// 任务调度，所有任务都要经过这里
function performConcurrentWorkOnRoot(root, didTimeout) {
	if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
		resetNestedUpdateFlag();
	}

	// Since we know we're in a React event, we can clear the current
	// event time. The next update will compute a new event time.
	currentEventTime = NoTimestamp;
	currentEventTransitionLane = NoLanes;

	if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
		throw new Error("Should not already be working.");
	}

	// Flush any pending passive effects before deciding which lanes to work on,
	// in case they schedule additional work.
	const originalCallbackNode = root.callbackNode;
	// 复原副作用
	const didFlushPassiveEffects = flushPassiveEffects();
	if (didFlushPassiveEffects) {
		// Something in the passive effect phase may have canceled the current task.
		// Check if the task node for this root was changed.
		// 退出或者取消任务
		if (root.callbackNode !== originalCallbackNode) {
			// The current task was canceled. Exit. We don't need to call
			// `ensureRootIsScheduled` because the check above implies either that
			// there's a new task, or that there's no remaining work on this root.
			return null;
		} else {
			// Current task was not canceled. Continue.
		}
	}

	// Determine the next lanes to work on, using the fields stored
	// on the root.
	let lanes = getNextLanes(
		root,
		root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
	);
	if (lanes === NoLanes) {
		// Defensive coding. This is never expected to happen.
		return null;
	}

	// We disable time-slicing in some cases: if the work has been CPU-bound
	// for too long ("expired" work, to prevent starvation), or we're in
	// sync-updates-by-default mode.
	// TODO: We only check `didTimeout` defensively, to account for a Scheduler
	// bug we're still investigating. Once the bug in Scheduler is fixed,
	// we can remove this, since we track expiration ourselves.
	const shouldTimeSlice =
		!includesBlockingLane(root, lanes) &&
		!includesExpiredLane(root, lanes) &&
		(disableSchedulerTimeoutInWorkLoop || !didTimeout);
	// renderRootConcurrent 并发模式，renderRootSync 同步模式
	let exitStatus = shouldTimeSlice
		? renderRootConcurrent(root, lanes)
		: renderRootSync(root, lanes);
	// 检测退出状态
	if (exitStatus !== RootInProgress) {
		// 检测是否为错误退出
		if (exitStatus === RootErrored) {
			// If something threw an error, try rendering one more time. We'll
			// render synchronously to block concurrent data mutations, and we'll
			// includes all pending updates are included. If it still fails after
			// the second attempt, we'll give up and commit the resulting tree.
			// 尝试恢复错误
			const errorRetryLanes = getLanesToRetrySynchronouslyOnError(root);
			if (errorRetryLanes !== NoLanes) {
				lanes = errorRetryLanes;
				exitStatus = recoverFromConcurrentError(root, errorRetryLanes);
			}
		}
		// 退出状态是否死亡
		if (exitStatus === RootFatalErrored) {
			const fatalError = workInProgressRootFatalError;
			prepareFreshStack(root, NoLanes);
			markRootSuspended(root, lanes);
			ensureRootIsScheduled(root, now());
			throw fatalError;
		}
		// 是否没有完成
		if (exitStatus === RootDidNotComplete) {
			// The render unwound without completing the tree. This happens in special
			// cases where need to exit the current render without producing a
			// consistent tree or committing.
			//
			// This should only happen during a concurrent render, not a discrete or
			// synchronous update. We should have already checked for this when we
			// unwound the stack.
			markRootSuspended(root, lanes);
		} else {
			// The render completed.

			// Check if this render may have yielded to a concurrent event, and if so,
			// confirm that any newly rendered stores are consistent.
			// TODO: It's possible that even a concurrent render may never have yielded
			// to the main thread, if it was fast enough, or if it expired. We could
			// skip the consistency check in that case, too.
			const renderWasConcurrent = !includesBlockingLane(root, lanes);
			const finishedWork = root.current.alternate;
			// 检查store 是否一致
			if (
				renderWasConcurrent &&
				!isRenderConsistentWithExternalStores(finishedWork)
			) {
				// A store was mutated in an interleaved event. Render again,
				// synchronously, to block further mutations.
				// 同步渲染root
				exitStatus = renderRootSync(root, lanes);

				// We need to check again if something threw
				// 再次判断是否出错
				if (exitStatus === RootErrored) {
					const errorRetryLanes =
						getLanesToRetrySynchronouslyOnError(root);
					if (errorRetryLanes !== NoLanes) {
						lanes = errorRetryLanes;
						exitStatus = recoverFromConcurrentError(
							root,
							errorRetryLanes
						);
						// We assume the tree is now consistent because we didn't yield to any
						// concurrent events.
					}
				}
				// 再次判断是否死亡
				if (exitStatus === RootFatalErrored) {
					const fatalError = workInProgressRootFatalError;
					prepareFreshStack(root, NoLanes);
					markRootSuspended(root, lanes);
					ensureRootIsScheduled(root, now());
					throw fatalError;
				}
			}

			// We now have a consistent tree. The next step is either to commit it,
			// or, if something suspended, wait to commit it after a timeout.
			// 获取到树，提交
			root.finishedWork = finishedWork;
			root.finishedLanes = lanes;
			// commitRoot 的入口
			finishConcurrentRender(root, exitStatus, lanes);
		}
	}

	// 重新进入根部调度
	ensureRootIsScheduled(root, now());
	if (root.callbackNode === originalCallbackNode) {
		// The task node scheduled for this root is the same one that's
		// currently executed. Need to return a continuation.
		return performConcurrentWorkOnRoot.bind(null, root);
	}
	return null;
}
```

### renderRootSync

```js
function renderRootSync(root, lanes) {
	const prevExecutionContext = executionContext;
	executionContext |= RenderContext;
	// 获取提交事件
	const prevDispatcher = pushDispatcher();

	// If the root or lanes have changed, throw out the existing stack
	// and prepare a fresh one. Otherwise we'll continue where we left off.
	if (
		workInProgressRoot !== root ||
		workInProgressRootRenderLanes !== lanes
	) {
		if (enableUpdaterTracking) {
			if (isDevToolsPresent) {
				const memoizedUpdaters = root.memoizedUpdaters;
				if (memoizedUpdaters.size > 0) {
					restorePendingUpdaters(root, workInProgressRootRenderLanes);
					memoizedUpdaters.clear();
				}

				// At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
				// If we bailout on this work, we'll move them back (like above).
				// It's important to move them now in case the work spawns more work at the same priority with different updaters.
				// That way we can keep the current update and future updates separate.
				movePendingFibersToMemoized(root, lanes);
			}
		}

		workInProgressTransitions = getTransitionsForLanes(root, lanes);
		prepareFreshStack(root, lanes);
	}

	if (__DEV__) {
		if (enableDebugTracing) {
			logRenderStarted(lanes);
		}
	}

	if (enableSchedulingProfiler) {
		markRenderStarted(lanes);
	}

	do {
		try {
			//- 同步任务
			workLoopSync();
			break;
		} catch (thrownValue) {
			handleError(root, thrownValue);
		}
		// 循环调用
	} while (true);
	resetContextDependencies();

	executionContext = prevExecutionContext;
	popDispatcher(prevDispatcher);

	if (workInProgress !== null) {
		// This is a sync render, so we should have finished the whole tree.
		throw new Error(
			"Cannot commit an incomplete root. This error is likely caused by a " +
				"bug in React. Please file an issue."
		);
	}

	if (__DEV__) {
		if (enableDebugTracing) {
			logRenderStopped();
		}
	}

	if (enableSchedulingProfiler) {
		markRenderStopped();
	}

	// Set this to null to indicate there's no in-progress render.
	workInProgressRoot = null;
	workInProgressRootRenderLanes = NoLanes;

	return workInProgressRootExitStatus;
}
```

### workLoopSync

```js
// The work loop is an extremely hot path. Tell Closure not to inline it.
/** @noinline */
function workLoopSync() {
	// Already timed out, so perform work without checking if we need to yield.
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}
```

### performUnitOfWork

```js
function performUnitOfWork(unitOfWork) {
	// The current, flushed, state of this fiber is the alternate. Ideally
	// nothing should rely on this, but relying on it here means that we don't
	// need an additional field on the work in progress.
	const current = unitOfWork.alternate;
	setCurrentDebugFiberInDEV(unitOfWork);

	let next;
	if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
		startProfilerTimer(unitOfWork);
		//- 开始工作
		next = beginWork(current, unitOfWork, subtreeRenderLanes);
		stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
	} else {
		next = beginWork(current, unitOfWork, subtreeRenderLanes);
	}

	resetCurrentDebugFiberInDEV();
	unitOfWork.memoizedProps = unitOfWork.pendingProps;
	// 是否还有节点
	if (next === null) {
		// If this doesn't spawn new work, complete the current work.
		completeUnitOfWork(unitOfWork);
	} else {
		workInProgress = next;
	}

	ReactCurrentOwner.current = null;
}
```

### beginWork

```js
function beginWork(current, workInProgress, renderLanes) {
	if (__DEV__) {
		if (workInProgress._debugNeedsRemount && current !== null) {
			// This will restart the begin phase with a new fiber.
			return remountFiber(
				current,
				workInProgress,
				createFiberFromTypeAndProps(
					workInProgress.type,
					workInProgress.key,
					workInProgress.pendingProps,
					workInProgress._debugOwner || null,
					workInProgress.mode,
					workInProgress.lanes
				)
			);
		}
	}

	if (current !== null) {
		const oldProps = current.memoizedProps;
		const newProps = workInProgress.pendingProps;

		/**
		 * 判断两个props 是否一致；
		 * didPerformWorkStackCursor 用于表示context 是否变化
		 *  */ 
		if (
			oldProps !== newProps ||
			hasLegacyContextChanged() ||
			// Force a re-render if the implementation changed due to hot reload:
			(__DEV__ ? workInProgress.type !== current.type : false)
		) {
			// If props or context changed, mark the fiber as having performed work.
			// This may be unset if the props are determined to be equal later (memo).
			didReceiveUpdate = true;
		} else {
			// Neither props nor legacy context changes. Check if there's a pending
			// update or context change.
			// 检查当前fiber节点上的lanes是否存在于renderLanes中
			const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
				current,
				renderLanes
			);
			if (
				!hasScheduledUpdateOrContext &&
				// If this is the second pass of an error or suspense boundary, there
				// may not be work scheduled on `current`, so we check for this flag.
				(workInProgress.flags & DidCapture) === NoFlags
			) {
				// No pending updates or context. Bail out now.
				// 表示是否有props更新，false为没有，true则有
				didReceiveUpdate = false;
				// 没有任务更新，复用节点，直接渲染
				return attemptEarlyBailoutIfNoScheduledUpdate(
					current,
					workInProgress,
					renderLanes
				);
			}
			if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
				// This is a special case that only exists for legacy mode.
				// See https://github.com/facebook/react/pull/19216.
				didReceiveUpdate = true;
			} else {
				// An update was scheduled on this fiber, but there are no new props
				// nor legacy context. Set this to false. If an update queue or context
				// consumer produces a changed value, it will set this to true. Otherwise,
				// the component will assume the children have not changed and bail out.
				didReceiveUpdate = false;
			}
		}
	} else {
		didReceiveUpdate = false;

		if (getIsHydrating() && isForkedChild(workInProgress)) {
			// Check if this child belongs to a list of muliple children in
			// its parent.
			//
			// In a true multi-threaded implementation, we would render children on
			// parallel threads. This would represent the beginning of a new render
			// thread for this subtree.
			//
			// We only use this for id generation during hydration, which is why the
			// logic is located in this special branch.
			const slotIndex = workInProgress.index;
			const numberOfForks = getForksAtLevel(workInProgress);
			pushTreeId(workInProgress, numberOfForks, slotIndex);
		}
	}

	// Before entering the begin phase, clear pending update priority.
	// TODO: This assumes that we're about to evaluate the component and process
	// the update queue. However, there's an exception: SimpleMemoComponent
	// sometimes bails out later in the begin phase. This indicates that we should
	// move this assignment out of the common path and into each branch.
	workInProgress.lanes = NoLanes;

	switch (workInProgress.tag) {
		case IndeterminateComponent: {
			return mountIndeterminateComponent(
				current,
				workInProgress,
				workInProgress.type,
				renderLanes
			);
		}
		case LazyComponent: {
			const elementType = workInProgress.elementType;
			return mountLazyComponent(
				current,
				workInProgress,
				elementType,
				renderLanes
			);
		}
		case FunctionComponent: {
			const Component = workInProgress.type;
			const unresolvedProps = workInProgress.pendingProps;
			const resolvedProps =
				workInProgress.elementType === Component
					? unresolvedProps
					: resolveDefaultProps(Component, unresolvedProps);
			return updateFunctionComponent(
				current,
				workInProgress,
				Component,
				resolvedProps,
				renderLanes
			);
		}
		case ClassComponent: {
			const Component = workInProgress.type;
			const unresolvedProps = workInProgress.pendingProps;
			const resolvedProps =
				workInProgress.elementType === Component
					? unresolvedProps
					: resolveDefaultProps(Component, unresolvedProps);
			return updateClassComponent(
				current,
				workInProgress,
				Component,
				resolvedProps,
				renderLanes
			);
		}
		case HostRoot:
			return updateHostRoot(current, workInProgress, renderLanes);
		case HostComponent:
			return updateHostComponent(current, workInProgress, renderLanes);
		case HostText:
			return updateHostText(current, workInProgress);
		case SuspenseComponent:
			return updateSuspenseComponent(
				current,
				workInProgress,
				renderLanes
			);
		case HostPortal:
			return updatePortalComponent(current, workInProgress, renderLanes);
		case ForwardRef: {
			const type = workInProgress.type;
			const unresolvedProps = workInProgress.pendingProps;
			const resolvedProps =
				workInProgress.elementType === type
					? unresolvedProps
					: resolveDefaultProps(type, unresolvedProps);
			return updateForwardRef(
				current,
				workInProgress,
				type,
				resolvedProps,
				renderLanes
			);
		}
		case Fragment:
			return updateFragment(current, workInProgress, renderLanes);
		case Mode:
			return updateMode(current, workInProgress, renderLanes);
		case Profiler:
			return updateProfiler(current, workInProgress, renderLanes);
		case ContextProvider:
			return updateContextProvider(current, workInProgress, renderLanes);
		case ContextConsumer:
			return updateContextConsumer(current, workInProgress, renderLanes);
		case MemoComponent: {
			const type = workInProgress.type;
			const unresolvedProps = workInProgress.pendingProps;
			// Resolve outer props first, then resolve inner props.
			let resolvedProps = resolveDefaultProps(type, unresolvedProps);
			if (__DEV__) {
				if (workInProgress.type !== workInProgress.elementType) {
					const outerPropTypes = type.propTypes;
					if (outerPropTypes) {
						checkPropTypes(
							outerPropTypes,
							resolvedProps, // Resolved for outer only
							"prop",
							getComponentNameFromType(type)
						);
					}
				}
			}
			resolvedProps = resolveDefaultProps(type.type, resolvedProps);
			return updateMemoComponent(
				current,
				workInProgress,
				type,
				resolvedProps,
				renderLanes
			);
		}
		case SimpleMemoComponent: {
			return updateSimpleMemoComponent(
				current,
				workInProgress,
				workInProgress.type,
				workInProgress.pendingProps,
				renderLanes
			);
		}
		case IncompleteClassComponent: {
			const Component = workInProgress.type;
			const unresolvedProps = workInProgress.pendingProps;
			const resolvedProps =
				workInProgress.elementType === Component
					? unresolvedProps
					: resolveDefaultProps(Component, unresolvedProps);
			return mountIncompleteClassComponent(
				current,
				workInProgress,
				Component,
				resolvedProps,
				renderLanes
			);
		}
		case SuspenseListComponent: {
			return updateSuspenseListComponent(
				current,
				workInProgress,
				renderLanes
			);
		}
		case ScopeComponent: {
			if (enableScopeAPI) {
				return updateScopeComponent(
					current,
					workInProgress,
					renderLanes
				);
			}
			break;
		}
		case OffscreenComponent: {
			return updateOffscreenComponent(
				current,
				workInProgress,
				renderLanes
			);
		}
		case LegacyHiddenComponent: {
			if (enableLegacyHidden) {
				return updateLegacyHiddenComponent(
					current,
					workInProgress,
					renderLanes
				);
			}
			break;
		}
		case CacheComponent: {
			if (enableCache) {
				return updateCacheComponent(
					current,
					workInProgress,
					renderLanes
				);
			}
			break;
		}
		case TracingMarkerComponent: {
			if (enableTransitionTracing) {
				return updateTracingMarkerComponent(
					current,
					workInProgress,
					renderLanes
				);
			}
			break;
		}
	}

	throw new Error(
		`Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
			"React. Please file an issue."
	);
}
```

### completeUnitOfWork

```js
function completeUnitOfWork(unitOfWork) {
	// Attempt to complete the current unit of work, then move to the next
	// sibling. If there are no more siblings, return to the parent fiber.
	let completedWork = unitOfWork;
	do {
		// The current, flushed, state of this fiber is the alternate. Ideally
		// nothing should rely on this, but relying on it here means that we don't
		// need an additional field on the work in progress.
		const current = completedWork.alternate;
		// 获取父节点
		const returnFiber = completedWork.return;

		// Check if the work completed or if something threw.
		if ((completedWork.flags & Incomplete) === NoFlags) {
			setCurrentDebugFiberInDEV(completedWork);
			let next;
			if (
				!enableProfilerTimer ||
				(completedWork.mode & ProfileMode) === NoMode
			) {
				// 完成了 执行fiber的完成工作
    			// 如果是原生的就创建真实的dom节点
				next = completeWork(current, completedWork, subtreeRenderLanes);
			} else {
				startProfilerTimer(completedWork);
				next = completeWork(current, completedWork, subtreeRenderLanes);
				// Update render duration assuming we didn't error.
				stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
			}
			resetCurrentDebugFiberInDEV();

			if (next !== null) {
				// Completing this fiber spawned new work. Work on that next.
				workInProgress = next;
				return;
			}
		} else {
			// This fiber did not complete because something threw. Pop values off
			// the stack without entering the complete phase. If this is a boundary,
			// capture values if possible.
			const next = unwindWork(current, completedWork, subtreeRenderLanes);

			// Because this fiber did not complete, don't reset its lanes.

			if (next !== null) {
				// If completing this work spawned new work, do that next. We'll come
				// back here again.
				// Since we're restarting, remove anything that is not a host effect
				// from the effect tag.
				next.flags &= HostEffectMask;
				workInProgress = next;
				return;
			}

			if (
				enableProfilerTimer &&
				(completedWork.mode & ProfileMode) !== NoMode
			) {
				// Record the render duration for the fiber that errored.
				stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);

				// Include the time spent working on failed children before continuing.
				let actualDuration = completedWork.actualDuration;
				// 孩子节点
				let child = completedWork.child;
				while (child !== null) {
					actualDuration += child.actualDuration;
					child = child.sibling;
				}
				completedWork.actualDuration = actualDuration;
			}

			if (returnFiber !== null) {
				// Mark the parent fiber as incomplete and clear its subtree flags.
				returnFiber.flags |= Incomplete;
				returnFiber.subtreeFlags = NoFlags;
				returnFiber.deletions = null;
			} else {
				// We've unwound all the way to the root.
				workInProgressRootExitStatus = RootDidNotComplete;
				workInProgress = null;
				return;
			}
		}

		// 兄弟节点
		const siblingFiber = completedWork.sibling;
		if (siblingFiber !== null) {
			// If there is more work to do in this returnFiber, do that next.
			workInProgress = siblingFiber;
			return;
		}
		// Otherwise, return to the parent
		// 完成 parent 节点
		completedWork = returnFiber;
		// Update the next thing we're working on in case something throws.
		workInProgress = completedWork;
	} while (completedWork !== null);

	// We've reached the root.
	// 完成 退出状态
	if (workInProgressRootExitStatus === RootInProgress) {
		workInProgressRootExitStatus = RootCompleted;
	}
}
```
