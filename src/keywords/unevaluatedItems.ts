import { isObject } from "../utils/isObject";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { validateNode } from "../validateNode";
import { isItemEvaluated } from "../isItemEvaluated";

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
        `${node.spointer}/unevaluatedItems`,
        `${node.schemaId}/unevaluatedItems`
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

    const errors: ValidationResult[] = [];
    // "unevaluatedItems with nested items"
    for (let i = 0; i < data.length; i += 1) {
        if (isItemEvaluated({ node, data, pointer, key: i, path })) {
            continue;
        }

        const value = data[i];
        const { node: child } = node.getChild(i, data, { path });

        if (child === undefined) {
            if (node.unevaluatedItems) {
                const result = validateNode(node.unevaluatedItems, value, `${pointer}/${i}`, path);
                if (result.length > 0) {
                    errors.push(...result);
                }
            } else {
                errors.push(
                    node.createError("UnevaluatedItemsError", {
                        pointer: `${pointer}/${i}`,
                        value: JSON.stringify(value),
                        schema
                    })
                );
            }
        }

        if (child && validateNode(child, value, `${pointer}/${i}`, path).length > 0) {
            // when a single node is invalid
            if (
                node.unevaluatedItems &&
                node.unevaluatedItems.validate(value, `${pointer}/${i}`, path).valid === false
            ) {
                return node.createError("UnevaluatedItemsError", {
                    pointer: `${pointer}/${i}`,
                    value: JSON.stringify(value),
                    schema
                });
            }

            if (node.schema.unevaluatedItems === false) {
                return node.createError("UnevaluatedItemsError", {
                    pointer: `${pointer}/${i}`,
                    value: JSON.stringify(value),
                    schema
                });
            }
        }
    }

    return errors;
}
