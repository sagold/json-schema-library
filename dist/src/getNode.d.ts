import { GetNodeOptions } from "./SchemaNode.js";
import { NodeOrError, OptionalNodeOrError } from "./types.js";
export declare function getNode(pointer: string, data: unknown, options: {
    withSchemaWarning: true;
} & GetNodeOptions): NodeOrError;
export declare function getNode(pointer: string, data: unknown, options: {
    createSchema: true;
} & GetNodeOptions): NodeOrError;
export declare function getNode(pointer: string, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
