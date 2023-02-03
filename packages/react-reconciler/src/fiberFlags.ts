export type Flags = number;

export const NoFlags = 0b0000000;
// 结构相关
export const Placement = 0b0000001;
// 属性相关
export const Update = 0b0000010;
// 结构相关
export const ChildDeletion = 0b0000100;

export const PassiveEffect = 0b0001000;

export const MutationMask = Placement | Update | ChildDeletion;

export const PassiveMask = PassiveEffect | ChildDeletion;
