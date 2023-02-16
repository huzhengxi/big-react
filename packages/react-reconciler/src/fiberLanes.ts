import { Lanes } from './fiberLanes';
import { FiberRootNode } from './fiber';
import { unstable_NormalPriority, unstable_getCurrentPriorityLevel } from 'scheduler';
import {
	unstable_IdlePriority,
	unstable_ImmediatePriority,
	unstable_NormalPriority,
	unstable_UserBlockingPriority,
	unstable_wrapCallback
} from 'scheduler';
export type Lane = number;
export type Lanes = number;

export const SyncLane = 0b0001;
export const NoLane = 0b0000;
export const NoLanes = 0b0000;
export const InputContinuousLane = 0b0010;
export const DefaultLane = 0b0100;
export const IdleLane = 0b1000;

export function mergeLanes(laneA: Lane, LaneB: Lane): Lanes {
	return laneA | LaneB;
}

export function requestUpdateLane() {
	// 从当前上下文环境中获取 Scheduler 优先级
	const currentSchedulerPriority = unstable_getCurrentPriorityLevel();
	const lane = schedulerPriorityToLane(currentSchedulerPriority);
	return lane;
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
	return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}

function lanesToSchedulerPriority(lanes: Lanes) {
	const lane = getHighestPriorityLane(lanes);
	if (SyncLane === lane) {
		return unstable_ImmediatePriority;
	}
	if (InputContinuousLane === lane) {
		return unstable_UserBlockingPriority;
	}
	if (DefaultLane === lane) {
		return unstable_NormalPriority;
	}
	return unstable_IdlePriority;
}

function schedulerPriorityToLane(schedulerPriority: number) {
	if (schedulerPriority === unstable_ImmediatePriority) {
		return SyncLane;
	}
	if (schedulerPriority === unstable_UserBlockingPriority) {
		return InputContinuousLane;
	}
	if (schedulerPriority === unstable_NormalPriority) {
		return DefaultLane;
	}
	return IdleLane;
}
