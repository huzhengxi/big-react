export type Container = Element;
type Instance = Element;

export const createInstance = (type: string, props: any) => {
	const element = document.createElement(type);
	return element;
};

export const appendInitialChild = (parent: Instance | Container, child: Instance) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;
