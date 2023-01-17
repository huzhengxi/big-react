export type Flags = number;

export const NoFlags = 0b00000001;
// 结构相关
export const Placement = 0b00000010;
// 属性相关
export const Update = 0b00000100;
// 结构相关
export const ChildDeletion = 0b000001000;

export const MutationMask = Placement | Update | ChildDeletion;
