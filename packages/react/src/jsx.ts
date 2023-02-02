import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { ElementType, Key, Props, ReactElementType, Ref, Type } from 'shared/ReactTypes';

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

function hasValidKey(config: any) {
	return config.key !== undefined;
}

function hasValidRef(config: any) {
	return config.ref !== undefined;
}

export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (hasValidKey(config)) {
				key = `${val}`;
			}
			continue;
		}
		if (prop === 'ref') {
			if (hasValidRef(config)) {
				ref = val;
			}
			continue;
		}

		if (Object.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}

	const maybeChildrenLength = maybeChildren.length;
	if (maybeChildrenLength) {
		// 将多余参数作为 children
		if (maybeChildrenLength === 1) {
			props.children = maybeChildren[0];
		} else {
			props.children = maybeChildren;
		}
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
			if (hasValidKey(config)) {
				key = `${val}`;
			}
			continue;
		}
		if (prop === 'ref') {
			ref = val;
			if (hasValidRef(config)) {
				ref = val;
			}
			continue;
		}

		if (Object.prototype.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}

	return ReactElement(type, key, ref, props);
};

export const isValidElement = (object: any) => {
	return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
};

export const Fragment = REACT_FRAGMENT_TYPE;
