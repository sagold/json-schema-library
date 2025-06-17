import { getValue } from "./utils/getValue.js";
import { validateNode } from "./validateNode.js";
/**
 * Returns true if an item is evaluated
 *
 * - Note that this check is partial, the remainder is done in unevaluatedItems
 * - This function currently checks for schema that are not visible by simple validation
 * - We could introduce this method as a new keyword-layer
 */
export function isItemEvaluated({ node, data, key, pointer, path }) {
    const value = getValue(data, key);
    if (node.schema.unevaluatedItems === true || node.schema.items === true) {
        return true;
    }
    if (node.contains && validateNode(node.contains, value, `${pointer}/${key}`, path).length === 0) {
        return true;
    }
    if (node.allOf) {
        for (let i = 0; i < node.allOf.length; i += 1) {
            if (isItemEvaluated({ node: node.allOf[i], data, key, pointer, path })) {
                return true;
            }
        }
    }
    if (node.anyOf) {
        for (let i = 0; i < node.anyOf.length; i += 1) {
            if (isItemEvaluated({ node: node.anyOf[i], data, key, pointer, path })) {
                return true;
            }
        }
    }
    if (node.oneOf) {
        for (let i = 0; i < node.oneOf.length; i += 1) {
            if (isItemEvaluated({ node: node.oneOf[i], data, key, pointer, path })) {
                return true;
            }
        }
    }
    if (node.if) {
        if (isItemEvaluated({ node: node.if, data, key, pointer, path })) {
            return true;
        }
        const validIf = validateNode(node.if, data, pointer, path).length === 0;
        if (validIf && node.if.prefixItems && node.if.prefixItems.length > key) {
            // evaluated by if
            return true;
        }
        if (validIf && node.then) {
            if (isItemEvaluated({ node: node.then, data, key, pointer, path })) {
                return true;
            }
        }
        else if (!validIf && node.else) {
            if (isItemEvaluated({ node: node.else, data, key, pointer, path })) {
                return true;
            }
        }
    }
}
