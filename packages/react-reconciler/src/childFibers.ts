import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Key, Props, ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement, createFiberFromFragment, createWorkInProgress } from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { Fragment, HostText } from './workTags';

type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}
	function deleteRemainingChildren(returnFiber: FiberNode, currentFirstChild: FiberNode | null) {
		if (!shouldTrackEffects) {
			return;
		}

		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}
	function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
		const key = element.key;

		// update
		while (currentFiber !== null) {
			// key 相同
			if (currentFiber.key === key) {
				// type 相同 可以复用
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						// 复用逻辑
						const existing = useFiber(currentFiber, props);
						existing.return = returnFiber;
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					}
					//key 相同， type 不同 删掉所有旧的
					// deleteChild(returnFiber, currentFiber);
					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					if (__DEV__) {
						console.warn('还未实现的 react 类型');
						break;
					}
				}
			} else {
				// key 不同，删掉旧的
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}
		// 根据 element 创建一个 fiber 并返回
		let fiber: FiberNode;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			fiber = createFiberFromElement(element);
		}
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number) {
		// update
		while (currentFiber !== null) {
			// 类型没变，可以复用
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		// shouldTrackEffects 为 true（追踪副作用）并且是首屏渲染的情况下
		if (shouldTrackEffects && fiber.alternate == null) {
			fiber.flags |= Placement;
		}

		return fiber;
	}

	function reconcileChildrenArray(returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: any[]) {
		// 最后一个可复用 fiber 在 current 中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个 fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个 fiber
		let firstNewFiber: FiberNode | null = null;

		// 1.将 current 保存在 map 中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key ?? current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}
		// 2.遍历 newChild，寻找是否可以复用
		for (let i = 0; i < newChild.length; i++) {
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) {
				continue;
			}

			// 3. 标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				// 移动
				if (oldIndex < lastPlacedIndex) {
					newFiber.flags |= Placement;
					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount
				newFiber.flags |= Placement;
			}
		}

		// 4. 将 map 中剩下的标记为删除
		existingChildren.forEach((fiber) => deleteChild(returnFiber, fiber));
		return firstNewFiber;
	}

	return function reconcilerChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断 Fragment
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_ELEMENT_TYPE &&
			newChild.key === null;

		if (isUnkeyedTopLevelFragment) {
			newChild = newChild?.props.children;
		}

		// 判断当前 fiber 的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild));
				default:
					if (__DEV__) {
						console.warn('未实现的 reconcile 类型', newChild);
					}
					break;
			}
			// 多节点的情况 ul > li * 3
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}
		}

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild));
		}

		// 兜底删除
		if (currentFiber !== null) {
			deleteRemainingChildren(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的 reconcile 类型：', newChild);
		}

		return null;
	};
}

function updateFromMap(
	returnFiber: FiberNode,
	existingChildren: ExistingChildren,
	index: number,
	element: any
): FiberNode | null {
	const keyToUse = element?.key ?? index;
	const before = existingChildren.get(keyToUse);

	// HostText
	if (typeof element === 'string' || typeof element === 'number') {
		if (before) {
			if (before.tag === HostText) {
				existingChildren.delete(keyToUse);
				return useFiber(before, { content: `${element}` });
			}
			return new FiberNode(HostText, { content: `${element}` }, null);
		}
	}

	// ReactElement
	if (typeof element === 'object' && element !== null) {
		switch (element.$$typeof) {
			case REACT_ELEMENT_TYPE: {
				if (before) {
					if (before.type === element.type) {
						existingChildren.delete(keyToUse);
						return useFiber(before, element.props);
					}
				}
				return createFiberFromElement(element);
			}
		}

		// TODO 数组类型
		if (Array.isArray(element) && __DEV__) {
			console.warn('还未实现数组类型的 child');
		}
	}
	return null;
}

function updateFragment(
	returnFiber: FiberNode,
	current: FiberNode | null,
	elements: any[],
	key: Key,
	existingChildren: ExistingChildren
) {
	let fiber: FiberNode;
	if (!current || current.tag !== Fragment) {
		fiber = createFiberFromFragment(elements, key);
	}
}

/**
 * 复用 FiberNode
 */
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const moundChildFibers = ChildReconciler(false);
