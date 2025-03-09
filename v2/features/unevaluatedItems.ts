import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { isSchemaNode, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import sanitizeErrors from "../utils/sanitizeErrors";

export function parseUnevaluatedItems(node: SchemaNode) {
    if (!isObject(node.schema.unevaluatedItems)) {
        return;
    }
    node.unevaluatedItems = node.compileSchema(
        node.schema.unevaluatedItems,
        `${node.schema.unevaluatedItems}/unevaluatedItems`
    );
}

/**
 * @draft >= 2019-09
 * Similar to additionalItems, but can "see" into subschemas and across references
 * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
 */
export function unevaluatedItemsValidator({ schema, validators }: SchemaNode): void {
    if (schema.unevaluatedItems == null) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        // if not in items, and not matches additionalItems
        if (
            !Array.isArray(data) ||
            data.length === 0 ||
            schema.unevaluatedItems == null ||
            schema.unevaluatedItems === true
        ) {
            return undefined;
        }

        if (node.schema.unevaluatedItems === true || node.schema.additionalItems === true) {
            return undefined;
        }

        const validIf = node.if && node.if.validate(data).length === 0;
        const errors: JsonError[] = [];
        // "unevaluatedItems with nested items"
        for (let i = 0; i < data.length; i += 1) {
            const value = data[i];
            const child = node.get(i, data);
            if (isSchemaNode(child)) {
                // when a single node is invalid
                if (child.validate(value).length > 0) {
                    // nothing should validate, so we validate unevaluated items only
                    if (node.unevaluatedItems) {
                        return sanitizeErrors(data.map((value, index) => node.unevaluatedItems.validate(value)));
                    }
                    if (node.schema.unevaluatedItems === false) {
                        return draft.errors.unevaluatedItemsError({
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
                    const result = node.unevaluatedItems.validate(value);
                    if (result.length > 0) {
                        errors.push(...result);
                    }
                } else {
                    errors.push(
                        draft.errors.unevaluatedItemsError({
                            pointer: `${pointer}/${i}`,
                            value: JSON.stringify(value),
                            schema
                        })
                    );
                }
            }
        }

        return errors;
    });
}
