import { SchemaNode } from "../types";
import { Keyword, ValidationPath } from "../Keyword";
export declare const $refKeyword: Keyword;
export declare function parseRef(node: SchemaNode): void;
export declare function resolveRef({ pointer, path }?: {
    pointer?: string;
    path?: ValidationPath;
}): SchemaNode;
export declare function getRef(node: SchemaNode, $ref?: string): SchemaNode | undefined;
