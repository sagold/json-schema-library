import { resolveNodeChild } from "./getNodeChild";
import { ValidationPath } from "./Keyword";
import { isJsonError, isSchemaNode, SchemaNode } from "./types";
import { appendDataPointer } from "./utils/appendDataPointer";
import { hasProperty } from "./utils/hasProperty";
import { validateNode } from "./validateNode";
import { findMatchingSchemata } from "./keywords/propertyDependencies";

type Options = {
    /** object node */
    node: SchemaNode;
    /** object data */
    data: Record<string, unknown>;
    /** property name to evaluate */
    key: string;
    /** pointer to object */
    pointer: string;

    path: ValidationPath;
    /** The current keyword cannot consume its own annotations. */
    skipUnevaluated?: boolean;
};

/**
 * Returns true if a property is evaluated
 *
 * - Note that this check is partial, the remainder is done in unevaluatedProperties
 * - This function currently checks for schema that are not visible by simple validation
 * - We could introduce this method as a new keyword-layer
 */
export function isPropertyEvaluated({ node, data, key, pointer, path, skipUnevaluated }: Options): boolean {
    if (Array.isArray(node.schema.required) && !node.schema.required.every((prop) => hasProperty(data, prop))) {
        return false;
    }

    if (node.schema.unevaluatedProperties === true || node.schema.additionalProperties === true) {
        return true;
    }

    if (
        !skipUnevaluated &&
        node.unevaluatedProperties &&
        !validateNode(node.unevaluatedProperties, data[key], appendDataPointer(pointer, key), path).some(isJsonError)
    ) {
        return true;
    }

    if (node.properties?.[key] && node.properties[key].validate(data[key], pointer, path).valid) {
        return true;
    }

    if (node.patternProperties && node.patternProperties.find((p) => p.pattern.test(key))) {
        return true;
    }

    const child = resolveNodeChild(node, key, data, { pointer, path })?.node;
    if (child && !validateNode(child, data[key], appendDataPointer(pointer, key), path).some(isJsonError)) {
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
            // only a branch that validates the data contributes evaluated-property state
            if (
                !validateNode(anyOf, data, pointer, path).some(isJsonError) &&
                isPropertyEvaluated({ node: anyOf, data, key, pointer, path })
            ) {
                return true;
            }
        }
    }

    if (node.oneOf) {
        for (const oneOf of node.oneOf) {
            // only a branch that validates the data contributes evaluated-property state
            if (
                !validateNode(oneOf, data, pointer, path).some(isJsonError) &&
                isPropertyEvaluated({ node: oneOf, data, key, pointer, path })
            ) {
                return true;
            }
        }
    }

    if (node.if) {
        const validIf = !validateNode(node.if, data, pointer, path).some(isJsonError);
        if (validIf && isPropertyEvaluated({ node: node.if, data, key, pointer, path })) {
            return true;
        }

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

    for (const [property, dependency] of Object.entries(node.dependentSchemas ?? {})) {
        if (
            hasProperty(data, property) &&
            isSchemaNode(dependency) &&
            !validateNode(dependency, data, pointer, path).some(isJsonError) &&
            isPropertyEvaluated({ node: dependency, data, key, pointer, path })
        ) {
            return true;
        }
    }

    for (const { node: dependency } of findMatchingSchemata(node, data) ?? []) {
        if (
            !validateNode(dependency, data, pointer, path).some(isJsonError) &&
            isPropertyEvaluated({ node: dependency, data, key, pointer, path })
        ) {
            return true;
        }
    }

    const resolved = node.resolveRef({ pointer, path });
    if (resolved !== node && isSchemaNode(resolved)) {
        if (isPropertyEvaluated({ node: resolved, data, key, pointer, path })) {
            return true;
        }
    }

    return false;
}
