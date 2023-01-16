import { ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from '../../shared/ReactSymbols';
import { FiberNode, createFiberFromElement } from './fiber';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {
	function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
		// 根据 element 创建一个 fiber 并返回
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number) {
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

		if (__DEV__) {
			console.warn('未实现的 reconcile 类型：', newChild);
		}

		return null;
	};
}

export const reconcileChildFibers = ChildReconciler(true);
export const moundChildFibers = ChildReconciler(false);
