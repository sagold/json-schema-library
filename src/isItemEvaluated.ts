import { ValidationPath } from "./Keyword";
import { SchemaNode } from "./types";
import { getValue } from "./utils/getValue";
import { isValid } from "./validateNode";

type Options = {
    /** array node */
    node: SchemaNode;
    /** array data */
    data: unknown[];
    /** array index to evaluate */
    key: number;
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
export function isItemEvaluated({ node, data, key, pointer, path }: Options) {
    const value = getValue(data, key);

    if (node.schema.unevaluatedItems === true || node.schema.items === true) {
        return true;
    }

    if (node.contains && isValid(node.contains, value, `${pointer}/${key}`, path)) {
        return true;
    }

    if (node.allOf) {
        for (const allOf of node.allOf) {
            if (isItemEvaluated({ node: allOf, data, key, pointer, path })) {
                return true;
            }
        }
    }
    if (node.anyOf) {
        for (const anyOf of node.anyOf) {
            // only a branch that validates the data contributes evaluated-item state
            if (isValid(anyOf, data, pointer, path) && isItemEvaluated({ node: anyOf, data, key, pointer, path })) {
                return true;
            }
        }
    }

    if (node.oneOf) {
        for (const oneOf of node.oneOf) {
            // only a branch that validates the data contributes evaluated-item state
            if (isValid(oneOf, data, pointer, path) && isItemEvaluated({ node: oneOf, data, key, pointer, path })) {
                return true;
            }
        }
    }

    if (node.if) {
        const validIf = isValid(node.if, data, pointer, path);
        if (validIf && isItemEvaluated({ node: node.if, data, key, pointer, path })) {
            return true;
        }

        if (validIf && node.if.prefixItems && node.if.prefixItems.length > key) {
            // evaluated by if
            return true;
        }

        if (validIf && node.then) {
            if (isItemEvaluated({ node: node.then, data, key, pointer, path })) {
                return true;
            }
        } else if (!validIf && node.else) {
            if (isItemEvaluated({ node: node.else, data, key, pointer, path })) {
                return true;
            }
        }
    }
}
