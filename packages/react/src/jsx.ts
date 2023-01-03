import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Type, Key, Ref, Props, ReactElementType } from 'shared/ReactTypes';

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

export const jsx = {};
