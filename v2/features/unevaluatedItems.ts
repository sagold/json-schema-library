import { isJsonError, JsonError } from "../../lib/types";
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

        // resolve all dynamic schemas
        const resolvedNode = node.reduce({ data, pointer });
        if (isJsonError(resolvedNode)) {
            return resolvedNode;
        }

        const resolvedSchema = resolvedNode.schema;
        // console.log("unevaluatedItems", JSON.stringify(resolvedSchema, null, 2), value);
        if (resolvedSchema.unevaluatedItems === true || resolvedSchema.additionalItems === true) {
            return undefined;
        }

        if (resolvedNode.if) {
            if (resolvedNode.if.validate(data).length === 0) {
                if (
                    Array.isArray(resolvedNode.if.schema.items) &&
                    resolvedNode.if.schema.items.length === data.length
                ) {
                    return undefined;
                }
            }
            // need to test remaining items?
        }

        if (resolvedNode.itemsObject) {
            const errors = sanitizeErrors(data.map((item) => resolvedNode.itemsObject.validate(item)));
            return errors.map((e) => draft.errors.unevaluatedItemsError({ ...e.data }));
        }

        if (resolvedNode.itemsList) {
            const items: { index: number; value: unknown }[] = [];
            for (let i = resolvedNode.itemsList.length; i < data.length; i += 1) {
                if (i < resolvedNode.itemsList.length) {
                    if (resolvedNode.itemsList[i].validate(data[i]).length > 0) {
                        items.push({ index: i, value: data[i] });
                    }
                } else {
                    items.push({ index: i, value: data[i] });
                }
            }
            return items.map((item) =>
                draft.errors.unevaluatedItemsError({
                    pointer: `${pointer}/${item.index}`,
                    value: JSON.stringify(item.value),
                    schema: resolvedSchema.unevaluatedItems
                })
            );
        }

        if (isSchemaNode(resolvedNode.unevaluatedItems)) {
            console.log("test all items if they are unevaluatedItems");
            return data.map((item, index) => {
                if (resolvedNode.unevaluatedItems.validate(item, `${pointer}/${index}`).length > 0) {
                    return draft.errors.unevaluatedItemsError({
                        pointer: `${pointer}/${index}`,
                        value: JSON.stringify(item),
                        schema: resolvedSchema.unevaluatedItems
                    });
                }
            });
        }

        const errors: JsonError[] = [];
        data.forEach((item, index) => {
            errors.push(
                draft.errors.unevaluatedItemsError({
                    pointer: `${pointer}/${index}`,
                    value: JSON.stringify(item),
                    schema
                })
            );
        });

        return errors;
    });
}
