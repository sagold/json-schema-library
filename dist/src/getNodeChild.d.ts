import { GetNodeOptions } from "./SchemaNode";
import { NodeOrError, OptionalNodeOrError } from "./types";
export declare function getNodeChild(key: string | number, data: unknown, options: {
    withSchemaWarning: true;
} & GetNodeOptions): NodeOrError;
export declare function getNodeChild(key: string | number, data: unknown, options: {
    createSchema: true;
} & GetNodeOptions): NodeOrError;
export declare function getNodeChild(key: string | number, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
