import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Type, Key, Ref, Props, ReactElementType, ElementType } from 'shared/ReactTypes';

const ReactElement = function (type: Type, key: Key, ref: Ref, props: Props): ReactElementType {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		key,
		type,
		ref,
		props,
		__mark: 'jason'
	};

	return element;
};

export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = `${val}`;
			}
			continue;
		}
		if (prop === 'ref') {
			ref = val;
		}

		if (Object.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}

	const maybeChildrenLength = maybeChildren.length;
	if (maybeChildrenLength) {
		// props.children = child
		props.children = maybeChildren[0];
	} else {
		//  props.children = [child1, child2, ...]
		props.children = maybeChildren;
	}

	return ReactElement(type, key, ref, props);
};

export const jsxDEV = (type: ElementType, config: any) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = `${val}`;
			}
			continue;
		}
		if (prop === 'ref') {
			ref = val;
		}

		if (Object.prototype.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}

	return ReactElement(type, key, ref, props);
};
