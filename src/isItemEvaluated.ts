import { resolveNodeChild } from "./getNodeChild";
import { ValidationPath } from "./Keyword";
import { isJsonError, isSchemaNode, SchemaNode } from "./types";
import { getValue } from "./utils/getValue";
import { validateNode } from "./validateNode";

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
    /** The current keyword cannot consume its own annotations. */
    skipUnevaluated?: boolean;
};

/**
 * Returns true if an item is evaluated
 *
 * - Note that this check is partial, the remainder is done in unevaluatedItems
 * - This function currently checks for schema that are not visible by simple validation
 * - We could introduce this method as a new keyword-layer
 */
export function isItemEvaluated({ node, data, key, pointer, path, skipUnevaluated }: Options): boolean {
    path = [...path, { pointer, node }];
    const value = getValue(data, key);

    if (node.schema.unevaluatedItems === true || node.schema.items === true) {
        return true;
    }

    if (
        !skipUnevaluated &&
        node.unevaluatedItems &&
        !validateNode(node.unevaluatedItems, value, `${pointer}/${key}`, path).some(isJsonError)
    ) {
        return true;
    }

    if (node.contains && !validateNode(node.contains, value, `${pointer}/${key}`, path).some(isJsonError)) {
        return true;
    }

    const child = resolveNodeChild(node, key, data, { pointer, path })?.node;
    if (child && !validateNode(child, value, `${pointer}/${key}`, path).some(isJsonError)) {
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
            if (
                !validateNode(anyOf, data, pointer, path).some(isJsonError) &&
                isItemEvaluated({ node: anyOf, data, key, pointer, path })
            ) {
                return true;
            }
        }
    }

    if (node.oneOf) {
        for (const oneOf of node.oneOf) {
            // only a branch that validates the data contributes evaluated-item state
            if (
                !validateNode(oneOf, data, pointer, path).some(isJsonError) &&
                isItemEvaluated({ node: oneOf, data, key, pointer, path })
            ) {
                return true;
            }
        }
    }

    if (node.if) {
        const validIf = !validateNode(node.if, data, pointer, path).some(isJsonError);
        if (validIf && isItemEvaluated({ node: node.if, data, key, pointer, path })) {
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

    const resolved = node.resolveRef({ pointer, path });
    if (resolved !== node && isSchemaNode(resolved)) {
        return isItemEvaluated({ node: resolved, data, key, pointer, path });
    }
    return false;
}
