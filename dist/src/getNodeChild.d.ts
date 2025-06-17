import { GetNodeOptions } from "./SchemaNode.js";
import { NodeOrError, OptionalNodeOrError } from "./types.js";
export declare function getNodeChild(key: string | number, data: unknown, options: {
    withSchemaWarning: true;
} & GetNodeOptions): NodeOrError;
export declare function getNodeChild(key: string | number, data: unknown, options: {
    createSchema: true;
} & GetNodeOptions): NodeOrError;
export declare function getNodeChild(key: string | number, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
