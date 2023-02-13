import './style.css';

import {
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	unstable_NormalPriority as NormalPriority,
	unstable_LowPriority as LowPriority,
	unstable_IdlePriority as IdlePriority,
	unstable_scheduleCallback as scheduleCallback,
	unstable_shouldYield as shouldYield,
	CallbackNode,
	unstable_getFirstCallbackNode as getFirstCallbackNode,
	unstable_cancelCallback as cancelCallback
} from 'scheduler';

const button = document.querySelector('button');
const root = document.querySelector('#root');

type Priority =
	| typeof ImmediatePriority
	| typeof UserBlockingPriority
	| typeof NormalPriority
	| typeof LowPriority
	| typeof IdlePriority;

interface Work {
	count: number;
	priority: Priority;
}

[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach((priority) => {
	const btn = document.createElement('button');
	root?.appendChild(btn);
	btn.innerText = ['', 'ImmediatePriority', 'UserBlockingPriority', 'NormalPriority', 'LowPriority'][priority];
	btn.onclick = () => {
		workList.unshift({
			count: 100,
			priority: priority as Priority
		});
		schedule();
	};
});

const workList: Work[] = [];
let prevPriority: Priority = IdlePriority;
let curCallback: CallbackNode | null = null;

function schedule() {
	const cbNode = getFirstCallbackNode();
	const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)?.[0];
	const { priority: curPriority } = curWork;

	if (!curWork) {
		curCallback = null;
		cbNode && cancelCallback(cbNode);
		return;
	}

	if (curPriority === prevPriority) {
		return;
	}

	// 遇到 更高优先级的 work，取消之前的调度，然后开始新的调度
	cbNode && cancelCallback(cbNode);

	curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
}

function perform(work: Work, didTimeout?: boolean) {
	/**
	 * 什么情况下不可中断？
	 * 1. work.priority (同步优先级——Immediate 不可中断)
	 * 2. 饥饿问题
	 * 3. 时间切片
	 */
	const needSync = work.priority === ImmediatePriority || didTimeout;

	while ((needSync || !shouldYield()) && work.count) {
		insertSpan(`${work.priority}`);
		work.count--;
	}
	prevPriority = work.priority;
	// 执行完
	if (!work.count) {
		const workIndex = workList.indexOf(work);
		workList.splice(workIndex, 1);
		prevPriority = IdlePriority;
	}

	const prevCallback = curCallback;
	schedule();
	const newCallback = curCallback;

	if (newCallback && prevCallback === newCallback) {
		perform.bind(null, work);
	}
}

function insertSpan(content) {
	const span = document.createElement('span');
	span.innerText = content;
	span.className = `pri-${content}`;
	doSomeBusyWork(100000);
	root?.appendChild(span);
}

function doSomeBusyWork(len: number) {
	let result = 0;
	while (len--) {
		result += len;
	}
}
