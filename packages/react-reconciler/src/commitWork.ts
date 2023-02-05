import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update,
	PassiveEffect,
	Flags,
	PassiveMask
} from './fiberFlags';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';

let nextEffect: FiberNode | null = null;
export const commitMutationEffects = (finishedWork: FiberNode, root: FiberRootNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		if ((nextEffect.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags && child !== null) {
			nextEffect = child;
		} else {
			// 向上遍历 DFS
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect, root);

				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode, root: FiberRootNode) => {
	const flags = finishedWork.flags;
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}

	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}

	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => commitDeletion(childToDelete, root));
		}
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}

	if ((flags & PassiveEffect) !== NoFlags) {
		// 收集回调
		commitPassiveEffect(finishedWork, root, 'update');
		finishedWork.flags &= ~PassiveEffect;
	}
};

function commitPassiveEffect(fiber: FiberNode, root: FiberRootNode, type: keyof PendingPassiveEffects) {
	if (fiber.tag !== FunctionComponent || (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)) {
		return;
	}
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue !== null) {
		if (updateQueue.lastEffect === null) {
			if (__DEV__) {
				console.warn('当 FC 存在 PassiveEffect flag 时，不应该不存在 updateQueue');
			}
			return;
		}
		root.pendingPassiveEffects[type].push(updateQueue.lastEffect);
	}
}

function commitHookEffectList(flags: Flags, lastEffect: Effect, callback: (effect: Effect) => void) {
	let effect = lastEffect.next as Effect;

	do {
		if ((effect.tag & flags) === flags) {
			callback(effect);
		}
		effect = effect.next as Effect;
	} while (effect !== lastEffect.next);
}

export function commitHookEffectListUnMount(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		effect.destroy?.();
		effect.tag &= ~HookHasEffect;
	});
}

export function commitHookEffectListDestroy(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		effect.destroy?.();
	});
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const create = effect.create;
		if (typeof create === 'function') {
			effect.destroy = create();
		}
	});
}

function recordHostChildrenToDelete(childrenToDelete: FiberNode[], unmountFiber: FiberNode) {
	// 1.找到第一个 root host 接节点
	const lastOne = childrenToDelete[childrenToDelete.length - 1];
	if (!lastOne) {
		childrenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountFiber === node) {
				childrenToDelete.push(unmountFiber);
				break;
			}
			node = node.sibling;
		}
	}
	// 2.每找到一个 host 节点，判断下这个节点是不是 1 中找到那个节点的兄弟节点
}

const commitDeletion = (childToDelete: FiberNode, root: FiberRootNode) => {
	const rootChildrenToDelete: FiberNode[] = [];
	// 递归子树
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				//TODO 解绑 ref
				return;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);

				return;
			case FunctionComponent:
				// TODO 解绑 ref
				commitPassiveEffect(unmountFiber, root, 'unmount');
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的 unmount 类型', unmountFiber);
					return;
				}
				break;
		}
	});

	// 移除 rootHostComponent 的 DOM
	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent);
			});
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
};
function commitNestedComponent(root: FiberNode, onCommitUnmount: (fiber: FiberNode) => void) {
	let node = root;
	while (true) {
		onCommitUnmount(node);
		// 向下遍历
		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		// 终止条件
		if (node === root) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上归
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行 Placement 操作', finishedWork);
	}

	// 找到 Parent DOM
	const hostParent = getHostParent(finishedWork);

	// host sibling
	const sibling = getHostSibling(finishedWork);

	// 把 finishedWork 对应的 DOM append 到 parent DOM 中
	if (hostParent) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		// 向上遍历找父节点的兄弟节点
		while (node.sibling === null) {
			const parent = node.return;

			// 找到头了 没找到
			if (parent === null || parent.tag === HostComponent || parent.tag === HostRoot) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;

		// 向下遍历找子节点的兄弟节点
		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 这里注意 不能将一个“不稳定”的的 HostText/HostComponent 作为HostSibling
			// 不稳定指的是：这个 fiber 本身也需要更新
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}
function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;

	// HostComponent HostRoot
	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到 HostParent', fiber);
	}
	return null;
}

function insertOrAppendPlacementNodeIntoContainer(finishedWork: FiberNode, hostParent: Container, before?: Instance) {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}

	const child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;
		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
