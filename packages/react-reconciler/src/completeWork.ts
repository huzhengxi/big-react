import { Container, appendInitialChild, createInstance, createTextInstance } from 'hostConfig';
import { FiberNode } from './fiber';
import { NoFlags, Update } from './fiberFlags';
import { Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
				updateFiberProps(wip.stateNode, newProps);
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
			// update
			if (current !== null && wip.stateNode) {
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// 1. 构建 DOM 树
				const instance = createTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			break;
		case HostRoot:
		case FunctionComponent:
		case Fragment:
			bubbleProperties(wip);
			break;
		default:
			if (__DEV__) {
				console.warn('未实现的 completeWork 情况：', wip);
			}
			break;
	}
};

function appendAllChildren(parent: Container, wip: FiberNode) {
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
