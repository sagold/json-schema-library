import { SchemaNode } from "../types";
export declare const SCHEMA_TYPES: string[];
/**
 * @helper for getData
 * returns schema type, which might be an educated guess based on defined schema
 * properties if an exact type cannot be retried from type.
 */
export declare function getSchemaType(node: SchemaNode, data: unknown): keyof typeof SCHEMA_TYPES | undefined;
