import { FiberNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
let workInProgress: FiberNode | null = null;

function prepareFreshStack(fiber: FiberNode) {
	workInProgress = fiber;
}

function renderRoot(fiber: FiberNode) {
	// 初始化
	prepareFreshStack(fiber);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workloop 发生错误', e);
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
