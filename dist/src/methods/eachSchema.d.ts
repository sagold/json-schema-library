import { SchemaNode } from "../types";
export type EachSchemaCallback = (node: SchemaNode) => unknown | true;
export declare function eachSchema(node: SchemaNode | unknown, callback: EachSchemaCallback): void;
