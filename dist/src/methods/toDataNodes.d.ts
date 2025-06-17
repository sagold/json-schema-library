import { SchemaNode } from "../types.js";
export type DataNode = {
    node: SchemaNode;
    value: unknown;
    pointer: string;
};
export declare function toDataNodes(node: SchemaNode, data: unknown, pointer?: string, dataNodes?: DataNode[]): DataNode[];
