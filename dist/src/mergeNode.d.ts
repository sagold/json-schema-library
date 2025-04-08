import { SchemaNode } from "./types";
interface SchemaNodeCB {
    toJSON?: () => string;
    order?: number;
    (...args: unknown[]): void;
}
export declare function removeDuplicates(fun: SchemaNodeCB, funIndex: number, list: ((...args: unknown[]) => void)[]): false | ((...args: unknown[]) => void);
export declare function mergeNode(a: SchemaNode, b?: SchemaNode, ...omit: string[]): SchemaNode | undefined;
export {};
