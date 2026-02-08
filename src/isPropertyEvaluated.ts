import { ValidationPath } from "./Keyword";
import { SchemaNode } from "./types";
import { hasProperty } from "./utils/hasProperty";
// import { getValue } from "./utils/getValue";
import { validateNode } from "./validateNode";

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
export function isPropertyEvaluated({ node, data, key, pointer, path }: Options) {
    if (Array.isArray(node.schema.required) && !node.schema.required.find((prop) => hasProperty(data, prop))) {
        return false;
    }

    if (node.schema.unevaluatedProperties === true || node.schema.additionalProperties === true) {
        return true;
    }

    if (node.properties?.[key] && node.properties[key].validate(data[key], pointer, path).valid) {
        return true;
    }

    if (node.patternProperties && node.patternProperties.find((p) => p.pattern.test(key))) {
        return true;
    }

    if (node.allOf) {
        for (const allOf of node.allOf) {
            if (isPropertyEvaluated({ node: allOf, data, key, pointer, path })) {
                return true;
            }
        }
    }

    if (node.anyOf) {
        for (const anyOf of node.anyOf) {
            if (isPropertyEvaluated({ node: anyOf, data, key, pointer, path })) {
                return true;
            }
        }
    }

    if (node.oneOf) {
        for (const oneOf of node.oneOf) {
            if (isPropertyEvaluated({ node: oneOf, data, key, pointer, path })) {
                return true;
            }
        }
    }

    if (node.if) {
        if (isPropertyEvaluated({ node: node.if, data, key, pointer, path })) {
            return true;
        }

        const validIf = validateNode(node.if, data, pointer, path).length === 0;
        if (validIf && node.then) {
            if (isPropertyEvaluated({ node: node.then, data, key, pointer, path })) {
                return true;
            }
        } else if (!validIf && node.else) {
            if (isPropertyEvaluated({ node: node.else, data, key, pointer, path })) {
                return true;
            }
        }
    }

    const resolved = node.resolveRef({ pointer, path });
    if (resolved !== node) {
        if (isPropertyEvaluated({ node: resolved, data, key, pointer, path })) {
            return true;
        }
    }

    return false;
}
