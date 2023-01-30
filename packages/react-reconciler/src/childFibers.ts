import { Props, ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from '../../shared/ReactSymbols';
import { FiberNode, FiberRootNode, createFiberFromElement, createWorkInProgress } from './fiber';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

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
	function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
		const key = element.key;

		// update
		work: if (currentFiber !== null) {
			// key 相同
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					// type 相同 可以复用
					if (currentFiber.type === element.type) {
						// 复用逻辑
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					}
					// 删掉旧的
					deleteChild(returnFiber, currentFiber);
					break work;
				} else {
					if (__DEV__) {
						console.warn('还未实现的 react 类型');
						break work;
					}
				}
			} else {
				// 删掉旧的
				deleteChild(returnFiber, currentFiber);
			}
		}
		// 根据 element 创建一个 fiber 并返回
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number) {
		// update
		if (currentFiber !== null) {
			// 类型没变，可以复用
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
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

	return function reconcilerChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
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
		}

		// TODO 多节点的情况 ul > li * 3

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild));
		}

		// 兜底删除
		if (currentFiber !== null) {
			deleteChild(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的 reconcile 类型：', newChild);
		}

		return null;
	};
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
