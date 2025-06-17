import { ValidationPath } from "./Keyword.js";
import { SchemaNode } from "./types.js";
type Options = {
    /** array node */
    node: SchemaNode;
    /** array data */
    data: Record<string, unknown>;
    /** array index to evaluate */
    key: string;
    /** pointer to array */
    pointer: string;
    path: ValidationPath;
};
/**
 * Returns true if an item is evaluated
 *
 * - Note that this check is partial, the remainder is done in unevaluatedItems
 * - This function currently checks for schema that are not visible by simple validation
 * - We could introduce this method as a new keyword-layer
 */
export declare function isPropertyEvaluated({ node, data, key, pointer, path }: Options): boolean;
export {};
