import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestroy,
	commitHookEffectListUnMount,
	commitMutationEffects
} from './commitWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, PendingPassiveEffects, createWorkInProgress } from './fiber';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import { Lane, NoLane, SyncLane, getHighestPriorityLane, markRootFinished, mergeLanes } from './fiberLanes';
import { flashSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';
import { unstable_scheduleCallback as scheduleCallback, unstable_NormalPriority as NormalPriority } from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
// 全局变量，防止多次调用
let rootDoesHasPassiveEffect = false;

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	workInProgress = createWorkInProgress(root.current, {});
	wipRootRenderLane = lane;
}

export const scheduleUpdateOnFiber = (fiber: FiberNode, lane: Lane) => {
	// TODO 调度功能
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);
};

function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	if (updateLane === NoLane) {
		return;
	}
	if (updateLane === SyncLane) {
		// 同步优先级，用微任务调度
		if (__DEV__) {
			console.log('在微任务中调度，优先级：', updateLane);
		}
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		scheduleMicroTask(flashSyncCallbacks);
	} else {
		// 其他优先级 用宏任务调度
	}
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = parent.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);
	if (nextLane !== SyncLane) {
		// 其他比 SyncLane 低的优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}
	// 初始化
	prepareFreshStack(root, lane);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop 发生错误', e);
			}
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;
	wipRootRenderLane = NoLane;

	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit 阶段开始', finishedWork);
	}

	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.warn('commit 阶段 finishedLane 不应该为 NoLane');
	}

	// 重置
	root.finishedWork = null;
	root.finishedLane = NoLane;

	markRootFinished(root, lane);

	if ((finishedWork.flags & PassiveMask) !== NoFlags || (finishedWork.subtreeFlags & PassiveMask) !== NoFlags) {
		if (!rootDoesHasPassiveEffect) {
			rootDoesHasPassiveEffect = true;
			// 调度副作用
			scheduleCallback(NormalPriority, () => {
				// 执行副作用
				flushPassiveEffects(root.pendingPassiveEffects);
				return;
			});
		}
	}

	// 判断是否存在三个子阶段需要执行的操作
	const subtreeHasEffect = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		commitMutationEffects(finishedWork, root);
		// mutation (Placement)
		// fiber 树 切换
		root.current = finishedWork;
		// layout (afterMutation)
	} else {
		root.current = finishedWork;
	}

	rootDoesHasPassiveEffect = false;
	ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
	// 首先触发所有 unmount effect，且对于某一个 fiber，如果触发了 unmount destroy，本次更新不会再触发 update create
	pendingPassiveEffects.unmount.forEach((effect) => {
		commitHookEffectListUnMount(Passive, effect);
	});
	pendingPassiveEffects.unmount = [];

	// 触发所有上次更新的 destroy
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListDestroy(Passive | HookHasEffect, effect);
	});

	// 触发所有上次更新的 create
	pendingPassiveEffects.update.forEach((effect) => {
		// 注意这里的一行 不写在‘触发 destroy 的循环中’的原因是：本次更新的任何 create 回调都必须在所有上一次更新的 destroy 回调执行完后再执行
		commitHookEffectListCreate(Passive, effect);
	});
	pendingPassiveEffects.update = [];

	// 在回调过程中（useEffect执行过程中）也有新的更新
	flashSyncCallbacks();
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	// beginWork 执行完成后返回 fiber 的子 fiber
	// 子 fiber 也就是 next 有可能为null
	const next = beginWork(fiber, wipRootRenderLane);
	fiber.memoizedProps = fiber.pendingProps;

	// 子 fiber 为空 说明递到最深层，就开始执行归的过程
	if (next == null) {
		completeUnitOfWork(fiber);
	} else {
		// 子 fiber 不为空的时候，将 next 赋值给 workInProgress 继续进行递操作
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
