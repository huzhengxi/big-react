import { Props, Key, Type, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

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

	memorizedProps: Props | null;
	alternate: FiberNode | null;

	flags: Flags;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 作为实例
		this.tag = tag;
		this.key = key;

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
		this.memorizedProps = null;

		this.alternate = null;
		// 副作用
		this.flags = NoFlags;
	}
}

export class FiberRootNode {
	container: Container;
	//current 指针 指向 HostRootFiber
	current: FiberNode;
	// 指向更新完成以后的 HostRootFiber，也就是完成递归流程的 HostRootFiber
	finishedWork: FiberNode | null;

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}
