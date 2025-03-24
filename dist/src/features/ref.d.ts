import { Feature, SchemaNode, ValidationPath } from "../types";
export declare const refFeature: Feature;
export declare function parseRef(node: SchemaNode): void;
export declare function resolveRef({ pointer, path }?: {
    pointer?: string;
    path?: ValidationPath;
}): SchemaNode;
export default function getRef(node: SchemaNode, $ref?: string): SchemaNode | undefined;
