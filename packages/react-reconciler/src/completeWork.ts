import { FiberNode, createWorkInProgress } from './fiber';
import { HostComponent, HostText, HostRoot } from './workTags';
import { createInstance } from 'hostConfig';
import { appendInitialChild, createTextInstance } from './hostConfig';
import { NoFlags } from './fiberFlags';

export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// 1. 构建DOM
				const instance = createInstance(wip.type, newProps);
				// 2. 将 DOM 插入到 DOM 树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			break;
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// 1. 构建 DOM 树
				const instance = createTextInstance(wip.type, newProps);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			break;
		case HostRoot:
			bubbleProperties(wip);
			break;
		default:
			if (__DEV__) {
				console.warn('未实现的 completeWork 情况：', wip);
			}
			break;
	}
};

function appendAllChildren(parent: FiberNode, wip: FiberNode) {
	let node = wip.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node.stateNode);
		}

		if (node === wip) {
			return;
		}

		while (node.sibling === null) {
			if (node.return == null || node.return === wip) {
				return;
			}
			node = node?.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}
