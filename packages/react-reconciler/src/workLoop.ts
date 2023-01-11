import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
	// TODO 调度功能

	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
};

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

function renderRoot(fiber: FiberRootNode) {
	// 初始化
	prepareFreshStack(fiber);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workloop 发生错误', e);
			}
			workInProgress = null;
		}
	} while (true);
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	// beginWork 执行完成后返回 fiber 的子 fiber
	// 子 fiber 也就是 next 有可能为null
	const next = beginWork(fiber);
	fiber.memorizedProps = fiber.pendingProps;

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
