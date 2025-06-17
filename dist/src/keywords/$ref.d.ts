import { SchemaNode } from "../types.js";
import { Keyword, ValidationPath, JsonSchemaReducerParams } from "../Keyword.js";
export declare const $refKeyword: Keyword;
export declare function parseRef(node: SchemaNode): void;
export declare function reduceRef({ node, data, key, pointer, path }: JsonSchemaReducerParams): SchemaNode | import("../types.js").JsonError<import("../types.js").ErrorData<{
    [p: string]: unknown;
}>>;
export declare function resolveRef({ pointer, path }?: {
    pointer?: string;
    path?: ValidationPath;
}): SchemaNode;
export declare function getRef(node: SchemaNode, $ref?: string): SchemaNode | undefined;
