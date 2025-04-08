import { SchemaNode } from "../types";
import { Keyword, ValidationPath, JsonSchemaReducerParams } from "../Keyword";
export declare const $refKeyword: Keyword;
export declare function parseRef(node: SchemaNode): void;
export declare function reduceRef({ node, data, key, pointer, path }: JsonSchemaReducerParams): SchemaNode | import("../types").JsonError<import("../types").ErrorData<{
    [p: string]: unknown;
}>>;
export declare function resolveRef({ pointer, path }?: {
    pointer?: string;
    path?: ValidationPath;
}): SchemaNode;
export declare function getRef(node: SchemaNode, $ref?: string): SchemaNode | undefined;
