import { Props, Key, Type, Ref } from 'shared/ReactTypes';
import { WorkTag, FunctionComponent, HostComponent, Fragment } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { Lanes, Lane, NoLanes, NoLane } from './fiberLanes';
import { Effect } from './fiberHooks';

export class FiberNode {
	type: Type;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	stateNode: any;
	ref: Ref;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	memoizedProps: Props | null;
	memoizedState: any;
	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags;
	updateQueue: unknown;
	deletions: FiberNode[] | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 作为实例
		this.tag = tag;
		this.key = key || null;

		// 保存的是jsx，如果是functionComponent的话 保存的是 function 执行的结果
		// 如果是 classComponent 的话 保存的是 render 方法的执行结果
		this.stateNode = null;
		// 如果是 functionComponent type 保存的是 function 本身
		this.type = null;

		// 作为树状结果
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.memoizedState = null;
		this.updateQueue = null;

		this.alternate = null;
		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}

export class FiberRootNode {
	container: Container;
	//current 指针 指向 HostRootFiber
	current: FiberNode;
	// 指向更新完成以后的 HostRootFiber，也就是完成递归流程的 HostRootFiber
	finishedWork: FiberNode | null;
	// 所有未必消费的 lane 的集合
	pendingLanes: Lanes;
	// 本次更新消费的 lane
	finishedLane: Lane;
	pendingPassiveEffects: PendingPassiveEffects;

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
		this.pendingLanes = NoLanes;
		this.finishedLane = NoLane;
		this.pendingPassiveEffects = {
			unmount: [],
			update: []
		};
	}
}

export const createWorkInProgress = (current: FiberNode, pendingProps: Props): FiberNode => {
	let wip = current.alternate;

	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
	}

	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};

export function createFiberFromElement(element: ReactElementType) {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;
	if (typeof type === 'string') {
		// <div/>  type: 'div
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未实现的 type 类型', element);
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;

	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key) {
	return new FiberNode(Fragment, elements, key);
}
