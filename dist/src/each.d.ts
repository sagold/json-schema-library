import { SchemaNode } from "./types";
export type EachCallback = (node: SchemaNode, data: unknown, pointer: string) => void;
export declare function each(node: SchemaNode, data: unknown, callback: EachCallback, pointer?: string): void;
