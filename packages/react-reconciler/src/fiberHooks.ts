import { FiberNode } from './fiber';
import { Dispatcher } from 'react/src/currentDispatcher';
import internals from 'shared/internals';
import { Dispatch } from 'react/src/currentDispatcher';
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;

const { currentDispatcher } = internals;
interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	//赋值操作
	currentlyRenderingFiber = wip;
	wip.memoizedState = null;

	const current = wip.alternate;
	if (current !== null) {
		// update
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);
	// 重置操作
	currentlyRenderingFiber = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(initialState: () => State | State): [State, Dispatch<State>] {
	// 找到当前 useState 对应的 hook 数据
	const hook = mountWorkInProgressHook();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.memoizedState = memoizedState;

	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
}

function dispatchSetState<State>(fiber: FiberNode, updateQueue: UpdateQueue<State>, action: Action<State>) {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		// mount 时  第一个 hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用 hook');
		}
		workInProgressHook = hook;
		currentlyRenderingFiber.memoizedState = workInProgressHook;
	} else {
		// mount 时 后续的 hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
