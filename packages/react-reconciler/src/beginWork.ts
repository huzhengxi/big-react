import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText, FunctionComponent, Fragment } from './workTags';
import { ReactElementType } from '../../shared/ReactTypes';
import { moundChildFibers, reconcileChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';
/**递归中的递阶段 */

export const beginWork = (wip: FiberNode) => {
	// 比较，返回子 fiberNode
	switch (wip.tag) {
		case HostRoot:
			// HostRoot 的 beginWork 工作流程：
			// 1. 计算状态的最新值 2. 创造子fiberNode
			return updateHostRoot(wip);
		case HostComponent: //例如：<div></div> 它自己无法触发更新
			// 创建子 fiberNode
			return updateHostComponent(wip);
		case HostText:
			return null;
		case Fragment:
			return updateFragment(wip);
		case FunctionComponent:
			return updateFunctionComponent(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的类型', wip);
			}
			break;
	}
};

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memorizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memorizedState;

	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);

	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode) {
	const nextChildren = renderWithHooks(wip);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current.child, children);
	} else {
		wip.child = moundChildFibers(wip, null, children);
	}
}
