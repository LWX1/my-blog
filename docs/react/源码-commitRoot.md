---
title: React commitRoot
date: 2023-3-12
isShowComments: false
tags:
    - react源码
categories:
    - react源码
---

## 源码

### 入口

#### commitRoot

-   存储当前优先级任务，把当前任务设为最好优先级，则不可打断，提交结束后，再把当前优先级任务重新赋值

```js
function commitRoot(root, recoverableErrors, transitions) {
	// TODO: This no longer makes any sense. We already wrap the mutation and
	// layout phases. Should be able to remove.
	// 获取当前的优先级
	const previousUpdateLanePriority = getCurrentUpdatePriority();
	const prevTransition = ReactCurrentBatchConfig.transition;

	try {
		ReactCurrentBatchConfig.transition = null;
		// 设为最高事件优先级不可打断
		setCurrentUpdatePriority(DiscreteEventPriority);
		// 提交
		commitRootImpl(
			root,
			recoverableErrors,
			transitions,
			previousUpdateLanePriority
		);
	} finally {
		ReactCurrentBatchConfig.transition = prevTransition;
		setCurrentUpdatePriority(previousUpdateLanePriority);
	}

	return null;
}
```

#### commitRootImpl

-   是否存在副作用链，存在则清空
-   清除一些全局变量，释放内存
-   在 commitBeforeMutationEffects 中执行 getSnapshotBeforeUpdate
-   在 commitMutationEffects 中执行对真实 dom 的操作
-   在 commitLayoutEffects 中执行可以获取到真实的 dom

```js
function commitRootImpl(
	root,
	recoverableErrors,
	transitions,
	renderPriorityLevel
) {
	do {
		// `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
		// means `flushPassiveEffects` will sometimes result in additional
		// passive effects. So we need to keep flushing in a loop until there are
		// no more pending effects.
		// TODO: Might be better if `flushPassiveEffects` did not automatically
		// flush synchronous work at the end, to avoid factoring hazards like this.
		// 清空effect副作用
		flushPassiveEffects();
	} while (rootWithPendingPassiveEffects !== null);
	flushRenderPhaseStrictModeWarningsInDEV();

	if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
		throw new Error("Should not already be working.");
	}
	// 获取最终的workInProgress 树
	const finishedWork = root.finishedWork;
	// 优先级
	const lanes = root.finishedLanes;

	if (enableSchedulingProfiler) {
		markCommitStarted(lanes);
	}

	if (finishedWork === null) {
		if (enableSchedulingProfiler) {
			markCommitStopped();
		}

		return null;
	} else {
	}
	// 清空挂载的属性，释放内存
	root.finishedWork = null;
	root.finishedLanes = NoLanes;

	if (finishedWork === root.current) {
		throw new Error(
			"Cannot commit the same tree as before. This error is likely caused by " +
				"a bug in React. Please file an issue."
		);
	}

	// commitRoot never returns a continuation; it always finishes synchronously.
	// So we can clear these now to allow a new callback to be scheduled.
	// 清空回调
	root.callbackNode = null;
	root.callbackPriority = NoLane;

	// Update the first and last pending times on this root. The new first
	// pending time is whatever is left on the root fiber.
	let remainingLanes = mergeLanes(
		finishedWork.lanes,
		finishedWork.childLanes
	);
	// 标记root 完成
	markRootFinished(root, remainingLanes);
	// 重置数据
	if (root === workInProgressRoot) {
		// We can reset these now that they are finished.
		workInProgressRoot = null;
		workInProgress = null;
		workInProgressRootRenderLanes = NoLanes;
	} else {
		// This indicates that the last root we worked on is not the same one that
		// we're committing now. This most commonly happens when a suspended root
		// times out.
	}

	// If there are pending passive effects, schedule a callback to process them.
	// Do this as early as possible, so it is queued before anything else that
	// might get scheduled in the commit phase. (See #16714.)
	// TODO: Delete all other places that schedule the passive effect callback
	// They're redundant.
	if (
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
		(finishedWork.flags & PassiveMask) !== NoFlags
	) {
		if (!rootDoesHavePassiveEffects) {
			rootDoesHavePassiveEffects = true;
			pendingPassiveEffectsRemainingLanes = remainingLanes;
			// workInProgressTransitions might be overwritten, so we want
			// to store it in pendingPassiveTransitions until they get processed
			// We need to pass this through as an argument to commitRoot
			// because workInProgressTransitions might have changed between
			// the previous render and commit if we throttle the commit
			// with setTimeout
			pendingPassiveTransitions = transitions;
			scheduleCallback(NormalSchedulerPriority, () => {
				flushPassiveEffects();
				// This render triggered passive effects: release the root cache pool
				// *after* passive effects fire to avoid freeing a cache pool that may
				// be referenced by a node in the tree (HostRoot, Cache boundary etc)
				return null;
			});
		}
	}

	// Check if there are any effects in the whole tree.
	// TODO: This is left over from the effect list implementation, where we had
	// to check for the existence of `firstEffect` to satisfy Flow. I think the
	// only other reason this optimization exists is because it affects profiling.
	// Reconsider whether this is necessary.
	// 孩子是否有更新
	const subtreeHasEffects =
		(finishedWork.subtreeFlags &
			(BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
		NoFlags;
	// fiber 是否更新
	const rootHasEffect =
		(finishedWork.flags &
			(BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
		NoFlags;
	// 存在effect
	if (subtreeHasEffects || rootHasEffect) {
		const prevTransition = ReactCurrentBatchConfig.transition;
		ReactCurrentBatchConfig.transition = null;
		const previousPriority = getCurrentUpdatePriority();
		setCurrentUpdatePriority(DiscreteEventPriority);

		const prevExecutionContext = executionContext;
		executionContext |= CommitContext;

		// Reset this to null before calling lifecycles
		// 生命周期前置空
		ReactCurrentOwner.current = null;

		// The commit phase is broken into several sub-phases. We do a separate pass
		// of the effect list for each phase: all mutation effects come before all
		// layout effects, and so on.

		// The first phase a "before mutation" phase. We use this phase to read the
		// state of the host tree right before we mutate it. This is where
		// getSnapshotBeforeUpdate is called.
		// 副作用提交前，可以在getSnapshotBeforeUpdate 中操作
		const shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(
			root,
			finishedWork
		);

		if (enableProfilerTimer) {
			// Mark the current commit time to be shared by all Profilers in this
			// batch. This enables them to be grouped later.
			recordCommitTime();
		}

		if (enableProfilerTimer && enableProfilerNestedUpdateScheduledHook) {
			// Track the root here, rather than in commitLayoutEffects(), because of ref setters.
			// Updates scheduled during ref detachment should also be flagged.
			rootCommittingMutationOrLayoutEffects = root;
		}

		// The next phase is the mutation phase, where we mutate the host tree.
		// 提交副作用
		commitMutationEffects(root, finishedWork, lanes);

		if (enableCreateEventHandleAPI) {
			if (shouldFireAfterActiveInstanceBlur) {
				afterActiveInstanceBlur();
			}
		}
		resetAfterCommit(root.containerInfo);

		// The work-in-progress tree is now the current tree. This must come after
		// the mutation phase, so that the previous tree is still current during
		// componentWillUnmount, but before the layout phase, so that the finished
		// work is current during componentDidMount/Update.
		root.current = finishedWork;

		// The next phase is the layout phase, where we call effects that read
		// the host tree after it's been mutated. The idiomatic use case for this is
		// layout, but class component lifecycles also fire here for legacy reasons.
		if (enableSchedulingProfiler) {
			markLayoutEffectsStarted(lanes);
		}
		// 提交页面渲染
		commitLayoutEffects(finishedWork, root, lanes);

		if (enableSchedulingProfiler) {
			markLayoutEffectsStopped();
		}

		if (enableProfilerTimer && enableProfilerNestedUpdateScheduledHook) {
			rootCommittingMutationOrLayoutEffects = null;
		}

		// Tell Scheduler to yield at the end of the frame, so the browser has an
		// opportunity to paint.
		requestPaint();

		executionContext = prevExecutionContext;

		// Reset the priority to the previous non-sync value.
		setCurrentUpdatePriority(previousPriority);
		ReactCurrentBatchConfig.transition = prevTransition;
	} else {
		// No effects.
		root.current = finishedWork;
		// Measure these anyway so the flamegraph explicitly shows that there were
		// no effects.
		// TODO: Maybe there's a better way to report this.
		if (enableProfilerTimer) {
			recordCommitTime();
		}
	}

	const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

	if (rootDoesHavePassiveEffects) {
		// This commit has passive effects. Stash a reference to them. But don't
		// schedule a callback until after flushing layout work.
		rootDoesHavePassiveEffects = false;
		rootWithPendingPassiveEffects = root;
		pendingPassiveEffectsLanes = lanes;
	} else {
		// There were no passive effects, so we can immediately release the cache
		// pool for this render.
		releaseRootPooledCache(root, remainingLanes);
	}

	// Read this again, since an effect might have updated it
	remainingLanes = root.pendingLanes;

	// Check if there's remaining work on this root
	// TODO: This is part of the `componentDidCatch` implementation. Its purpose
	// is to detect whether something might have called setState inside
	// `componentDidCatch`. The mechanism is known to be flawed because `setState`
	// inside `componentDidCatch` is itself flawed — that's why we recommend
	// `getDerivedStateFromError` instead. However, it could be improved by
	// checking if remainingLanes includes Sync work, instead of whether there's
	// any work remaining at all (which would also include stuff like Suspense
	// retries or transitions). It's been like this for a while, though, so fixing
	// it probably isn't that urgent.
	if (remainingLanes === NoLanes) {
		// If there's no remaining work, we can clear the set of already failed
		// error boundaries.
		legacyErrorBoundariesThatAlreadyFailed = null;
	}

	onCommitRootDevTools(finishedWork.stateNode, renderPriorityLevel);

	if (enableUpdaterTracking) {
		if (isDevToolsPresent) {
			root.memoizedUpdaters.clear();
		}
	}

	// Always call this before exiting `commitRoot`, to ensure that any
	// additional work on this root is scheduled.
	ensureRootIsScheduled(root, now());

	if (recoverableErrors !== null) {
		// There were errors during this render, but recovered from them without
		// needing to surface it to the UI. We log them here.
		const onRecoverableError = root.onRecoverableError;
		for (let i = 0; i < recoverableErrors.length; i++) {
			const recoverableError = recoverableErrors[i];
			const componentStack = recoverableError.stack;
			const digest = recoverableError.digest;
			onRecoverableError(recoverableError.value, {
				componentStack,
				digest,
			});
		}
	}

	if (hasUncaughtError) {
		hasUncaughtError = false;
		const error = firstUncaughtError;
		firstUncaughtError = null;
		throw error;
	}

	// If the passive effects are the result of a discrete render, flush them
	// synchronously at the end of the current task so that the result is
	// immediately observable. Otherwise, we assume that they are not
	// order-dependent and do not need to be observed by external systems, so we
	// can wait until after paint.
	// TODO: We can optimize this by not scheduling the callback earlier. Since we
	// currently schedule the callback in multiple places, will wait until those
	// are consolidated.
	if (
		includesSomeLane(pendingPassiveEffectsLanes, SyncLane) &&
		root.tag !== LegacyRoot
	) {
		flushPassiveEffects();
	}

	// Read this again, since a passive effect might have updated it
	remainingLanes = root.pendingLanes;
	if (includesSomeLane(remainingLanes, SyncLane)) {
		if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
			markNestedUpdateScheduled();
		}

		// Count the number of times the root synchronously re-renders without
		// finishing. If there are too many, it indicates an infinite update loop.
		if (root === rootWithNestedUpdates) {
			nestedUpdateCount++;
		} else {
			nestedUpdateCount = 0;
			rootWithNestedUpdates = root;
		}
	} else {
		nestedUpdateCount = 0;
	}

	// If layout work was scheduled, flush it now.
	flushSyncCallbacks();

	if (enableSchedulingProfiler) {
		markCommitStopped();
	}

	return null;
}
```

### 提交之前

#### commitBeforeMutationEffects

-   跟踪未处理的 fiber，直到提交后

```js
export function commitBeforeMutationEffects(root, firstChild) {
	// 查看是否还有未处理的，有则返回相应fiber
	focusedInstanceHandle = prepareForCommit(root.containerInfo);
	//   遍历副作用
	nextEffect = firstChild;
	//  开始提交
	commitBeforeMutationEffects_begin();

	// We no longer need to track the active instance fiber
	// 不再跟踪fiber
	const shouldFire = shouldFireAfterActiveInstanceBlur;
	shouldFireAfterActiveInstanceBlur = false;
	focusedInstanceHandle = null;

	return shouldFire;
}
```

#### commitBeforeMutationEffects_begin

-   深度遍历 fiber，获取标记删除的 fiber，通过 subtreeFlags 判断当前 fiber 是否发生改变，没有改变则提前调用 commitBeforeMutationEffects_complete 完成。

```js
function commitBeforeMutationEffects_begin() {
	// 链表遍历
	while (nextEffect !== null) {
		const fiber = nextEffect;

		// This phase is only used for beforeActiveInstanceBlur.
		// Let's skip the whole loop if it's off.
		if (enableCreateEventHandleAPI) {
			// TODO: Should wrap this in flags check, too, as optimization
			// 是否标记删除
			const deletions = fiber.deletions;
			if (deletions !== null) {
				for (let i = 0; i < deletions.length; i++) {
					const deletion = deletions[i];
					commitBeforeMutationEffectsDeletion(deletion);
				}
			}
		}
		// 获取子节点
		const child = fiber.child;
		// 判断孩子是否发生改变，没有改变则直接完成，改变则替代
		if (
			(fiber.subtreeFlags & BeforeMutationMask) !== NoFlags &&
			child !== null
		) {
			child.return = fiber;
			nextEffect = child;
		} else {
			// 完成fiber的props 和 state
			commitBeforeMutationEffects_complete();
		}
	}
}
```

#### commitBeforeMutationEffects_complete

-   通过深度遍历完成 fiber 的提交

```js
function commitBeforeMutationEffects_complete() {
	while (nextEffect !== null) {
		const fiber = nextEffect;
		setCurrentDebugFiberInDEV(fiber);
		try {
			// 提交需要改变的fiber
			commitBeforeMutationEffectsOnFiber(fiber);
		} catch (error) {
			captureCommitPhaseError(fiber, fiber.return, error);
		}
		resetCurrentDebugFiberInDEV();
		// 是否存在兄弟节点
		const sibling = fiber.sibling;
		if (sibling !== null) {
			// 替代改变的数据
			sibling.return = fiber.return;
			nextEffect = sibling;
			return;
		}

		nextEffect = fiber.return;
	}
}
```

#### commitBeforeMutationEffectsOnFiber

-   触发 getSnapshotBeforeUpdate 生命周期

```js
function commitBeforeMutationEffectsOnFiber(finishedWork) {
	// 获取current 树
	const current = finishedWork.alternate;
	// 更新标记
	const flags = finishedWork.flags;

	if (enableCreateEventHandleAPI) {
		if (
			!shouldFireAfterActiveInstanceBlur &&
			focusedInstanceHandle !== null
		) {
			// Check to see if the focused element was inside of a hidden (Suspense) subtree.
			// TODO: Move this out of the hot path using a dedicated effect tag.
			if (
				finishedWork.tag === SuspenseComponent &&
				isSuspenseBoundaryBeingHidden(current, finishedWork) &&
				doesFiberContain(finishedWork, focusedInstanceHandle)
			) {
				shouldFireAfterActiveInstanceBlur = true;
				beforeActiveInstanceBlur(finishedWork);
			}
		}
	}

	if ((flags & Snapshot) !== NoFlags) {
		setCurrentDebugFiberInDEV(finishedWork);

		switch (finishedWork.tag) {
			case FunctionComponent:
			case ForwardRef:
			case SimpleMemoComponent: {
				break;
			}
			case ClassComponent: {
				if (current !== null) {
					const prevProps = current.memoizedProps;
					const prevState = current.memoizedState;
					const instance = finishedWork.stateNode;
					// We could update instance props and state here,
					// but instead we rely on them being set during last render.
					// TODO: revisit this when we implement resuming.
					// 触发getSnapshotBeforeUpdate 生命周期
					const snapshot = instance.getSnapshotBeforeUpdate(
						finishedWork.elementType === finishedWork.type
							? prevProps
							: resolveDefaultProps(finishedWork.type, prevProps),
						prevState
					);

					instance.__reactInternalSnapshotBeforeUpdate = snapshot;
				}
				break;
			}
			case HostRoot: {
				if (supportsMutation) {
					const root = finishedWork.stateNode;
					// 清除容器的子节点
					clearContainer(root.containerInfo);
				}
				break;
			}
			case HostComponent:
			case HostText:
			case HostPortal:
			case IncompleteClassComponent:
				// Nothing to do for these component types
				break;
			default: {
				throw new Error(
					"This unit of work tag should not have side-effects. This error is " +
						"likely caused by a bug in React. Please file an issue."
				);
			}
		}

		resetCurrentDebugFiberInDEV();
	}
}
```

### 提交

#### commitMutationEffects

-   渲染页面

```js
export function commitMutationEffects(root, finishedWork, committedLanes) {
	inProgressLanes = committedLanes;
	inProgressRoot = root;

	setCurrentDebugFiberInDEV(finishedWork);
	// 提交副作用，并渲染页面
	commitMutationEffectsOnFiber(finishedWork, root, committedLanes);
	setCurrentDebugFiberInDEV(finishedWork);

	inProgressLanes = null;
	inProgressRoot = null;
}
```

#### commitMutationEffectsOnFiber

-

```js
function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
	// current 树
	const current = finishedWork.alternate;
	const flags = finishedWork.flags;

	// The effect flag should be checked *after* we refine the type of fiber,
	// because the fiber tag is more specific. An exception is any flag related
	// to reconcilation, because those can be set on all fiber types.
	switch (finishedWork.tag) {
		case FunctionComponent:
		case ForwardRef:
		case MemoComponent:
		case SimpleMemoComponent: {
			// 删除dom
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			// 插入dom
			commitReconciliationEffects(finishedWork);

			if (flags & Update) {
				try {
					// 循环执行effect.destory 方法
					commitHookEffectListUnmount(
						HookInsertion | HookHasEffect,
						finishedWork,
						finishedWork.return
					);
					// 循环执行effect.create 方法
					commitHookEffectListMount(
						HookInsertion | HookHasEffect,
						finishedWork
					);
				} catch (error) {
					captureCommitPhaseError(
						finishedWork,
						finishedWork.return,
						error
					);
				}
				// Layout effects are destroyed during the mutation phase so that all
				// destroy functions for all fibers are called before any create functions.
				// This prevents sibling component effects from interfering with each other,
				// e.g. a destroy function in one component should never override a ref set
				// by a create function in another component during the same commit.
				if (
					enableProfilerTimer &&
					enableProfilerCommitHooks &&
					finishedWork.mode & ProfileMode
				) {
					try {
						startLayoutEffectTimer();
						commitHookEffectListUnmount(
							HookLayout | HookHasEffect,
							finishedWork,
							finishedWork.return
						);
					} catch (error) {
						captureCommitPhaseError(
							finishedWork,
							finishedWork.return,
							error
						);
					}
					recordLayoutEffectDuration(finishedWork);
				} else {
					try {
						commitHookEffectListUnmount(
							HookLayout | HookHasEffect,
							finishedWork,
							finishedWork.return
						);
					} catch (error) {
						captureCommitPhaseError(
							finishedWork,
							finishedWork.return,
							error
						);
					}
				}
			}
			return;
		}
		case ClassComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			if (flags & Ref) {
				if (current !== null) {
					safelyDetachRef(current, current.return);
				}
			}
			return;
		}
		case HostComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			if (flags & Ref) {
				if (current !== null) {
					safelyDetachRef(current, current.return);
				}
			}
			if (supportsMutation) {
				// TODO: ContentReset gets cleared by the children during the commit
				// phase. This is a refactor hazard because it means we must read
				// flags the flags after `commitReconciliationEffects` has already run;
				// the order matters. We should refactor so that ContentReset does not
				// rely on mutating the flag during commit. Like by setting a flag
				// during the render phase instead.
				if (finishedWork.flags & ContentReset) {
					const instance = finishedWork.stateNode;
					try {
						resetTextContent(instance);
					} catch (error) {
						captureCommitPhaseError(
							finishedWork,
							finishedWork.return,
							error
						);
					}
				}

				if (flags & Update) {
					const instance = finishedWork.stateNode;
					if (instance != null) {
						// Commit the work prepared earlier.
						const newProps = finishedWork.memoizedProps;
						// For hydration we reuse the update path but we treat the oldProps
						// as the newProps. The updatePayload will contain the real change in
						// this case.
						const oldProps =
							current !== null ? current.memoizedProps : newProps;
						const type = finishedWork.type;
						// TODO: Type the updateQueue to be specific to host components.
						const updatePayload = finishedWork.updateQueue;
						finishedWork.updateQueue = null;
						if (updatePayload !== null) {
							try {
								commitUpdate(
									instance,
									updatePayload,
									type,
									oldProps,
									newProps,
									finishedWork
								);
							} catch (error) {
								captureCommitPhaseError(
									finishedWork,
									finishedWork.return,
									error
								);
							}
						}
					}
				}
			}
			return;
		}
		case HostText: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			if (flags & Update) {
				if (supportsMutation) {
					if (finishedWork.stateNode === null) {
						throw new Error(
							"This should have a text node initialized. This error is likely " +
								"caused by a bug in React. Please file an issue."
						);
					}

					const textInstance = finishedWork.stateNode;
					const newText = finishedWork.memoizedProps;
					// For hydration we reuse the update path but we treat the oldProps
					// as the newProps. The updatePayload will contain the real change in
					// this case.
					const oldText =
						current !== null ? current.memoizedProps : newText;

					try {
						commitTextUpdate(textInstance, oldText, newText);
					} catch (error) {
						captureCommitPhaseError(
							finishedWork,
							finishedWork.return,
							error
						);
					}
				}
			}
			return;
		}
		case HostRoot: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			if (flags & Update) {
				if (supportsMutation && supportsHydration) {
					if (current !== null) {
						const prevRootState = current.memoizedState;
						if (prevRootState.isDehydrated) {
							try {
								commitHydratedContainer(root.containerInfo);
							} catch (error) {
								captureCommitPhaseError(
									finishedWork,
									finishedWork.return,
									error
								);
							}
						}
					}
				}
				if (supportsPersistence) {
					const containerInfo = root.containerInfo;
					const pendingChildren = root.pendingChildren;
					try {
						replaceContainerChildren(
							containerInfo,
							pendingChildren
						);
					} catch (error) {
						captureCommitPhaseError(
							finishedWork,
							finishedWork.return,
							error
						);
					}
				}
			}
			return;
		}
		case HostPortal: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			if (flags & Update) {
				if (supportsPersistence) {
					const portal = finishedWork.stateNode;
					const containerInfo = portal.containerInfo;
					const pendingChildren = portal.pendingChildren;
					try {
						replaceContainerChildren(
							containerInfo,
							pendingChildren
						);
					} catch (error) {
						captureCommitPhaseError(
							finishedWork,
							finishedWork.return,
							error
						);
					}
				}
			}
			return;
		}
		case SuspenseComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			const offscreenFiber = finishedWork.child;

			if (offscreenFiber.flags & Visibility) {
				const offscreenInstance = offscreenFiber.stateNode;
				const newState = offscreenFiber.memoizedState;
				const isHidden = newState !== null;

				// Track the current state on the Offscreen instance so we can
				// read it during an event
				offscreenInstance.isHidden = isHidden;

				if (isHidden) {
					const wasHidden =
						offscreenFiber.alternate !== null &&
						offscreenFiber.alternate.memoizedState !== null;
					if (!wasHidden) {
						// TODO: Move to passive phase
						markCommitTimeOfFallback();
					}
				}
			}

			if (flags & Update) {
				try {
					commitSuspenseCallback(finishedWork);
				} catch (error) {
					captureCommitPhaseError(
						finishedWork,
						finishedWork.return,
						error
					);
				}
				attachSuspenseRetryListeners(finishedWork);
			}
			return;
		}
		case OffscreenComponent: {
			const wasHidden =
				current !== null && current.memoizedState !== null;

			if (
				// TODO: Remove this dead flag
				enableSuspenseLayoutEffectSemantics &&
				finishedWork.mode & ConcurrentMode
			) {
				// Before committing the children, track on the stack whether this
				// offscreen subtree was already hidden, so that we don't unmount the
				// effects again.
				const prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
				offscreenSubtreeWasHidden =
					prevOffscreenSubtreeWasHidden || wasHidden;
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
			} else {
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			}

			commitReconciliationEffects(finishedWork);

			if (flags & Visibility) {
				const offscreenInstance = finishedWork.stateNode;
				const newState = finishedWork.memoizedState;
				const isHidden = newState !== null;
				const offscreenBoundary = finishedWork;

				// Track the current state on the Offscreen instance so we can
				// read it during an event
				offscreenInstance.isHidden = isHidden;

				if (enableSuspenseLayoutEffectSemantics) {
					if (isHidden) {
						if (!wasHidden) {
							if (
								(offscreenBoundary.mode & ConcurrentMode) !==
								NoMode
							) {
								nextEffect = offscreenBoundary;
								let offscreenChild = offscreenBoundary.child;
								while (offscreenChild !== null) {
									nextEffect = offscreenChild;
									disappearLayoutEffects_begin(
										offscreenChild
									);
									offscreenChild = offscreenChild.sibling;
								}
							}
						}
					} else {
						if (wasHidden) {
							// TODO: Move re-appear call here for symmetry?
						}
					}
				}

				if (supportsMutation) {
					// TODO: This needs to run whenever there's an insertion or update
					// inside a hidden Offscreen tree.
					hideOrUnhideAllChildren(offscreenBoundary, isHidden);
				}
			}
			return;
		}
		case SuspenseListComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			if (flags & Update) {
				attachSuspenseRetryListeners(finishedWork);
			}
			return;
		}
		case ScopeComponent: {
			if (enableScopeAPI) {
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);

				// TODO: This is a temporary solution that allowed us to transition away
				// from React Flare on www.
				if (flags & Ref) {
					if (current !== null) {
						safelyDetachRef(finishedWork, finishedWork.return);
					}
					safelyAttachRef(finishedWork, finishedWork.return);
				}
				if (flags & Update) {
					const scopeInstance = finishedWork.stateNode;
					prepareScopeUpdate(scopeInstance, finishedWork);
				}
			}
			return;
		}
		default: {
			recursivelyTraverseMutationEffects(root, finishedWork, lanes);
			commitReconciliationEffects(finishedWork);

			return;
		}
	}
}
```

#### recursivelyTraverseMutationEffects

-   清除删除的节点

```js
function recursivelyTraverseMutationEffects(root, parentFiber, lanes) {
	// Deletions effects can be scheduled on any fiber type. They need to happen
	// before the children effects hae fired.
	// 删除的fiber
	const deletions = parentFiber.deletions;
	if (deletions !== null) {
		for (let i = 0; i < deletions.length; i++) {
			const childToDelete = deletions[i];
			try {
				commitDeletionEffects(root, parentFiber, childToDelete);
			} catch (error) {
				captureCommitPhaseError(childToDelete, parentFiber, error);
			}
		}
	}

	const prevDebugFiber = getCurrentDebugFiberInDEV();
	if (parentFiber.subtreeFlags & MutationMask) {
		let child = parentFiber.child;
		while (child !== null) {
			setCurrentDebugFiberInDEV(child);
			commitMutationEffectsOnFiber(child, root, lanes);
			child = child.sibling;
		}
	}
	setCurrentDebugFiberInDEV(prevDebugFiber);
}
```

#### commitReconciliationEffects

```js
function commitReconciliationEffects(finishedWork) {
	// Placement effects (insertions, reorders) can be scheduled on any fiber
	// type. They needs to happen after the children effects have fired, but
	// before the effects on this fiber have fired.
	const flags = finishedWork.flags;
	if (flags & Placement) {
		try {
			// 添加fiber
			commitPlacement(finishedWork);
		} catch (error) {
			captureCommitPhaseError(finishedWork, finishedWork.return, error);
		}
		// Clear the "placement" from effect tag so that we know that this is
		// inserted, before any life-cycles like componentDidMount gets called.
		// TODO: findDOMNode doesn't rely on this any more but isMounted does
		// and isMounted is deprecated anyway so we should be able to kill this.
		finishedWork.flags &= ~Placement;
	}
	if (flags & Hydrating) {
		finishedWork.flags &= ~Hydrating;
	}
}
```

### 渲染

#### commitLayoutEffects

-   执行 useEffectLayout，componentDidMount，componentDidUpdate

```js
export function commitLayoutEffects(finishedWork, root, committedLanes) {
	inProgressLanes = committedLanes;
	inProgressRoot = root;
	nextEffect = finishedWork;
	// 开始
	commitLayoutEffects_begin(finishedWork, root, committedLanes);

	inProgressLanes = null;
	inProgressRoot = null;
}
```

#### commitLayoutEffects_begin

```js
function commitLayoutEffects_begin(subtreeRoot, root, committedLanes) {
	// Suspense layout effects semantics don't change for legacy roots.
	const isModernRoot = (subtreeRoot.mode & ConcurrentMode) !== NoMode;
	// 遍历
	while (nextEffect !== null) {
		const fiber = nextEffect;
		const firstChild = fiber.child;

		if (
			enableSuspenseLayoutEffectSemantics &&
			fiber.tag === OffscreenComponent &&
			isModernRoot
		) {
			// Keep track of the current Offscreen stack's state.
			// 判断孩子是否存在副作用
			const isHidden = fiber.memoizedState !== null;
			const newOffscreenSubtreeIsHidden =
				isHidden || offscreenSubtreeIsHidden;
			if (newOffscreenSubtreeIsHidden) {
				// The Offscreen tree is hidden. Skip over its layout effects.

				commitLayoutMountEffects_complete(
					subtreeRoot,
					root,
					committedLanes
				);
				continue;
			} else {
				// TODO (Offscreen) Also check: subtreeFlags & LayoutMask
				const current = fiber.alternate;
				const wasHidden =
					current !== null && current.memoizedState !== null;
				const newOffscreenSubtreeWasHidden =
					wasHidden || offscreenSubtreeWasHidden;
				const prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
				const prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;

				// Traverse the Offscreen subtree with the current Offscreen as the root.
				offscreenSubtreeIsHidden = newOffscreenSubtreeIsHidden;
				offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden;

				if (
					offscreenSubtreeWasHidden &&
					!prevOffscreenSubtreeWasHidden
				) {
					// This is the root of a reappearing boundary. Turn its layout effects
					// back on.
					nextEffect = fiber;
					reappearLayoutEffects_begin(fiber);
				}

				let child = firstChild;
				while (child !== null) {
					nextEffect = child;
					commitLayoutEffects_begin(
						child, // New root; bubble back up to here and stop.
						root,
						committedLanes
					);
					child = child.sibling;
				}

				// Restore Offscreen state and resume in our-progress traversal.
				nextEffect = fiber;
				offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
				offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
				commitLayoutMountEffects_complete(
					subtreeRoot,
					root,
					committedLanes
				);

				continue;
			}
		}

		if (
			(fiber.subtreeFlags & LayoutMask) !== NoFlags &&
			firstChild !== null
		) {
			firstChild.return = fiber;
			nextEffect = firstChild;
		} else {
			commitLayoutMountEffects_complete(
				subtreeRoot,
				root,
				committedLanes
			);
		}
	}
}
```

#### commitLayoutMountEffects_complete

-   自身完成副作用

```js
function commitLayoutMountEffects_complete(subtreeRoot, root, committedLanes) {
	while (nextEffect !== null) {
		// console.log(nextEffect, 'next')
		const fiber = nextEffect;
		if ((fiber.flags & LayoutMask) !== NoFlags) {
			const current = fiber.alternate;
			setCurrentDebugFiberInDEV(fiber);
			try {
				commitLayoutEffectOnFiber(root, current, fiber, committedLanes);
			} catch (error) {
				captureCommitPhaseError(fiber, fiber.return, error);
			}
			resetCurrentDebugFiberInDEV();
		}

		if (fiber === subtreeRoot) {
			nextEffect = null;
			return;
		}

		const sibling = fiber.sibling;
		if (sibling !== null) {
			sibling.return = fiber.return;
			nextEffect = sibling;
			return;
		}

		nextEffect = fiber.return;
	}
}
```

#### commitLayoutEffectOnFiber

```js
function commitLayoutEffectOnFiber(
	finishedRoot,
	current,
	finishedWork,
	committedLanes
) {
	if ((finishedWork.flags & LayoutMask) !== NoFlags) {
		switch (finishedWork.tag) {
			case FunctionComponent:
			case ForwardRef:
			case SimpleMemoComponent: {
				if (
					!enableSuspenseLayoutEffectSemantics ||
					!offscreenSubtreeWasHidden
				) {
					// At this point layout effects have already been destroyed (during mutation phase).
					// This is done to prevent sibling component effects from interfering with each other,
					// e.g. a destroy function in one component should never override a ref set
					// by a create function in another component during the same commit.
					if (
						enableProfilerTimer &&
						enableProfilerCommitHooks &&
						finishedWork.mode & ProfileMode
					) {
						try {
							startLayoutEffectTimer();
							// 处理副作用
							commitHookEffectListMount(
								HookLayout | HookHasEffect,
								finishedWork
							);
						} finally {
							recordLayoutEffectDuration(finishedWork);
						}
					} else {
						commitHookEffectListMount(
							HookLayout | HookHasEffect,
							finishedWork
						);
					}
				}
				break;
			}
			case ClassComponent: {
				const instance = finishedWork.stateNode;
				if (finishedWork.flags & Update) {
					if (!offscreenSubtreeWasHidden) {
						if (current === null) {
							// We could update instance props and state here,
							// but instead we rely on them being set during last render.
							// TODO: revisit this when we implement resuming.

							if (
								enableProfilerTimer &&
								enableProfilerCommitHooks &&
								finishedWork.mode & ProfileMode
							) {
								try {
									startLayoutEffectTimer();
									//   执行生命周期componentDidMount
									instance.componentDidMount();
								} finally {
									recordLayoutEffectDuration(finishedWork);
								}
							} else {
								instance.componentDidMount();
							}
						} else {
							const prevProps =
								finishedWork.elementType === finishedWork.type
									? current.memoizedProps
									: resolveDefaultProps(
											finishedWork.type,
											current.memoizedProps
									  );
							const prevState = current.memoizedState;
							// We could update instance props and state here,
							// but instead we rely on them being set during last render.
							// TODO: revisit this when we implement resuming.

							if (
								enableProfilerTimer &&
								enableProfilerCommitHooks &&
								finishedWork.mode & ProfileMode
							) {
								try {
									startLayoutEffectTimer();
									//   执行生命周期componentDidUpdate
									instance.componentDidUpdate(
										prevProps,
										prevState,
										instance.__reactInternalSnapshotBeforeUpdate
									);
								} finally {
									recordLayoutEffectDuration(finishedWork);
								}
							} else {
								instance.componentDidUpdate(
									prevProps,
									prevState,
									instance.__reactInternalSnapshotBeforeUpdate
								);
							}
						}
					}
				}

				// TODO: I think this is now always non-null by the time it reaches the
				// commit phase. Consider removing the type check.
				const updateQueue = finishedWork.updateQueue;
				if (updateQueue !== null) {
					// We could update instance props and state here,
					// but instead we rely on them being set during last render.
					// TODO: revisit this when we implement resuming.
					commitUpdateQueue(finishedWork, updateQueue, instance);
				}
				break;
			}
			case HostRoot: {
				// TODO: I think this is now always non-null by the time it reaches the
				// commit phase. Consider removing the type check.
				const updateQueue = finishedWork.updateQueue;
				if (updateQueue !== null) {
					let instance = null;
					if (finishedWork.child !== null) {
						switch (finishedWork.child.tag) {
							case HostComponent:
								instance = getPublicInstance(
									finishedWork.child.stateNode
								);
								break;
							case ClassComponent:
								instance = finishedWork.child.stateNode;
								break;
						}
					}
					commitUpdateQueue(finishedWork, updateQueue, instance);
				}
				break;
			}
			case HostComponent: {
				const instance = finishedWork.stateNode;

				// Renderers may schedule work to be done after host components are mounted
				// (eg DOM renderer may schedule auto-focus for inputs and form controls).
				// These effects should only be committed when components are first mounted,
				// aka when there is no current/alternate.
				if (current === null && finishedWork.flags & Update) {
					const type = finishedWork.type;
					const props = finishedWork.memoizedProps;
					commitMount(instance, type, props, finishedWork);
				}

				break;
			}
			case HostText: {
				// We have no life-cycles associated with text.
				break;
			}
			case HostPortal: {
				// We have no life-cycles associated with portals.
				break;
			}
			case Profiler: {
				if (enableProfilerTimer) {
					const { onCommit, onRender } = finishedWork.memoizedProps;
					const { effectDuration } = finishedWork.stateNode;

					const commitTime = getCommitTime();

					let phase = current === null ? "mount" : "update";
					if (enableProfilerNestedUpdatePhase) {
						if (isCurrentUpdateNested()) {
							phase = "nested-update";
						}
					}

					if (typeof onRender === "function") {
						onRender(
							finishedWork.memoizedProps.id,
							phase,
							finishedWork.actualDuration,
							finishedWork.treeBaseDuration,
							finishedWork.actualStartTime,
							commitTime
						);
					}

					if (enableProfilerCommitHooks) {
						if (typeof onCommit === "function") {
							onCommit(
								finishedWork.memoizedProps.id,
								phase,
								effectDuration,
								commitTime
							);
						}

						// Schedule a passive effect for this Profiler to call onPostCommit hooks.
						// This effect should be scheduled even if there is no onPostCommit callback for this Profiler,
						// because the effect is also where times bubble to parent Profilers.
						enqueuePendingPassiveProfilerEffect(finishedWork);

						// Propagate layout effect durations to the next nearest Profiler ancestor.
						// Do not reset these values until the next render so DevTools has a chance to read them first.
						let parentFiber = finishedWork.return;
						outer: while (parentFiber !== null) {
							switch (parentFiber.tag) {
								case HostRoot:
									const root = parentFiber.stateNode;
									root.effectDuration += effectDuration;
									break outer;
								case Profiler:
									const parentStateNode =
										parentFiber.stateNode;
									parentStateNode.effectDuration +=
										effectDuration;
									break outer;
							}
							parentFiber = parentFiber.return;
						}
					}
				}
				break;
			}
			case SuspenseComponent: {
				commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
				break;
			}
			case SuspenseListComponent:
			case IncompleteClassComponent:
			case ScopeComponent:
			case OffscreenComponent:
			case LegacyHiddenComponent:
			case TracingMarkerComponent: {
				break;
			}

			default:
				throw new Error(
					"This unit of work tag should not have side-effects. This error is " +
						"likely caused by a bug in React. Please file an issue."
				);
		}
	}

	if (!enableSuspenseLayoutEffectSemantics || !offscreenSubtreeWasHidden) {
		if (enableScopeAPI) {
			// TODO: This is a temporary solution that allowed us to transition away
			// from React Flare on www.
			if (
				finishedWork.flags & Ref &&
				finishedWork.tag !== ScopeComponent
			) {
				commitAttachRef(finishedWork);
			}
		} else {
			if (finishedWork.flags & Ref) {
				commitAttachRef(finishedWork);
			}
		}
	}
}
```

### 总结

- 在**commitRoot** 中，把事件的优先级升为最高，则不可被打断，变为同步任务。
- 清空存在的副作用和一些全局变量，释放内存
- 提交主要分为三个阶段**commitBeforeMutationEffects**，**commitMutationEffects**，**commitLayoutEffects**
- **commitBeforeMutationEffects** 中主要执行生命周期**getSnapshotBeforeUpdate**
- **commitMutationEffects** 中通过副作用的判断，渲染页面
- **commitLayoutEffects** 中可以获取到生成的真实**dom** 数据，主要执行**useEffectLayout** 钩子和 **componentDidMount**，**componentDidUpdate** 生命周期
