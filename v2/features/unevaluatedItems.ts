import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { Feature, isSchemaNode, JsonSchemaValidatorParams, SchemaNode } from "../types";
import sanitizeErrors from "../utils/sanitizeErrors";

/**
 * @draft >= 2019-09
 * Similar to additionalItems, but can "see" into subschemas and across references
 * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
 */
export const unevaluatedItemsFeature: Feature = {
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

    // const reducedNode = node;
    let reducedNode = node.reduce({ data, pointer, path });
    reducedNode = isSchemaNode(reducedNode) ? reducedNode : node;
    if (reducedNode.schema.unevaluatedItems === true || reducedNode.schema.additionalItems === true) {
        return undefined;
    }

    // console.log("EVAL", reducedNode.schema);

    const validIf = node.if != null && node.if.validate(data, pointer, path).length === 0;
    const errors: JsonError[] = [];
    // "unevaluatedItems with nested items"
    for (let i = 0; i < data.length; i += 1) {
        const value = data[i];
        const child = node.get(i, data, { path });
        // console.log(`CHILD '${i}':`, data[i], "=>", child?.schema);

        if (isSchemaNode(child)) {
            // when a single node is invalid
            if (child.validate(value, `${pointer}/${i}`, path).length > 0) {
                // nothing should validate, so we validate unevaluated items only
                if (node.unevaluatedItems) {
                    return sanitizeErrors(
                        data.map((value, index) => node.unevaluatedItems.validate(value, `${pointer}/${i}`, path))
                    );
                }
                if (node.schema.unevaluatedItems === false) {
                    return node.errors.unevaluatedItemsError({
                        pointer: `${pointer}/${i}`,
                        value: JSON.stringify(value),
                        schema
                    });
                }
            }
        }
        // "unevaluatedItems false"
        if (child === undefined) {
            if (validIf && node.if.itemsList && node.if.itemsList.length > i) {
                // evaluated by if -- skip
            } else if (node.unevaluatedItems) {
                const result = node.unevaluatedItems.validate(value, `${pointer}/${i}`, path);
                if (result.length > 0) {
                    errors.push(...result);
                }
            } else {
                errors.push(
                    node.errors.unevaluatedItemsError({
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
