import { isObject } from "../../utils/isObject";
import { SchemaNode } from "../../types";
import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../../Keyword";
import sanitizeErrors from "../../utils/sanitizeErrors";
import { validateNode } from "../../validateNode";

/**
 * @draft >= 2019-09
 * Similar to additionalItems, but can "see" into subschemas and across references
 * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
 */
export const unevaluatedItemsKeyword: Keyword = {
    id: "unevaluatedItems",
    keyword: "unevaluatedItems",
    parse: parseUnevaluatedItems,
    addValidate: ({ schema }) => schema.unevaluatedItems != null,
    validate: validateUnevaluatedItems
};

export function parseUnevaluatedItems(node: SchemaNode) {
    if (!isObject(node.schema.unevaluatedItems)) {
        return;
    }
    node.unevaluatedItems = node.compileSchema(
        node.schema.unevaluatedItems,
        `${node.evaluationPath}/unevaluatedItems`,
        `${node.schemaLocation}/unevaluatedItems`
    );
}

function validateUnevaluatedItems({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    const { schema } = node;
    // if not in items, and not matches additionalItems
    if (
        !Array.isArray(data) ||
        data.length === 0 ||
        schema.unevaluatedItems == null ||
        schema.unevaluatedItems === true
    ) {
        return undefined;
    }

    // const reducedNode = node;
    let { node: reducedNode } = node.reduceNode(data, { pointer, path });
    reducedNode = reducedNode ?? node;
    if (reducedNode.schema.unevaluatedItems === true || reducedNode.schema.additionalItems === true) {
        return undefined;
    }

    // console.log("EVAL", reducedNode.schema);

    const validIf = node.if != null && validateNode(node.if, data, pointer, path).length === 0;
    const errors: ValidationResult[] = [];
    // "unevaluatedItems with nested items"
    for (let i = 0; i < data.length; i += 1) {
        const value = data[i];
        const { node: child } = node.getNodeChild(i, data, { path });
        // console.log(`CHILD '${i}':`, data[i], "=>", child?.schema);

        if (child) {
            // when a single node is invalid
            if (validateNode(child, value, `${pointer}/${i}`, path).length > 0) {
                // nothing should validate, so we validate unevaluated items only
                if (node.unevaluatedItems) {
                    return sanitizeErrors(
                        data.map((value) => validateNode(node.unevaluatedItems, value, `${pointer}/${i}`, path))
                    );
                }
                if (node.schema.unevaluatedItems === false) {
                    return node.createError("unevaluated-items-error", {
                        pointer: `${pointer}/${i}`,
                        value: JSON.stringify(value),
                        schema
                    });
                }
            }
        }
        // "unevaluatedItems false"
        if (child === undefined) {
            if (validIf && node.if.prefixItems && node.if.prefixItems.length > i) {
                // evaluated by if -- skip
            } else if (node.unevaluatedItems) {
                const result = validateNode(node.unevaluatedItems, value, `${pointer}/${i}`, path);
                if (result.length > 0) {
                    errors.push(...result);
                }
            } else {
                errors.push(
                    node.createError("unevaluated-items-error", {
                        pointer: `${pointer}/${i}`,
                        value: JSON.stringify(value),
                        schema
                    })
                );
            }
        }
    }

    return errors;
}
