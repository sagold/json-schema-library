import { GetNodeOptions } from "./SchemaNode";
import { NodeOrError, OptionalNodeOrError } from "./types";
export declare function getNode(pointer: string, data: unknown, options: {
    withSchemaWarning: true;
} & GetNodeOptions): NodeOrError;
export declare function getNode(pointer: string, data: unknown, options: {
    createSchema: true;
} & GetNodeOptions): NodeOrError;
export declare function getNode(pointer: string, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
