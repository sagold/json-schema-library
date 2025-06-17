import { Keyword, ValidationPath } from "../../Keyword.js";
import { SchemaNode } from "../../types.js";
export declare const $refKeyword: Keyword;
export declare function parseRef(node: SchemaNode): void;
export declare function resolveRef({ pointer, path }?: {
    pointer?: string;
    path?: ValidationPath;
}): SchemaNode;
export default function getRef(node: SchemaNode, $ref?: string): SchemaNode | undefined;
