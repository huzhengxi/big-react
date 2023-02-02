import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { Container } from 'hostConfig';
import { createUpdateQueue, createUpdate, enqueueUpdate, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { requestUpdateLane } from './fiberLanes';
export function createContainer(container: Container) {
	// react.createRoot 的时候会调用
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);
	hostRootFiber.updateQueue = createUpdateQueue();
	return root;
}

export function updateContainer(element: ReactElementType | null, root: FiberRootNode) {
	// react.createRoot.render 的时候会调用
	const hostRootFiber = root.current;
	const lane = requestUpdateLane();
	const update = createUpdate<ReactElementType | null>(element, lane);
	enqueueUpdate(hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>, update);

	scheduleUpdateOnFiber(hostRootFiber, lane);
	return element;
}
