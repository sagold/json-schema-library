import { JsonError, SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import deepEqual from "fast-deep-equal";

const KEYWORD = "uniqueItems";

export const uniqueItemsKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseUniqueItems,
    addValidate: ({ schema }) => schema[KEYWORD] === true,
    validate: validateUniqueItems
};

function parseUniqueItems(node: SchemaNode) {
    const uniqueItems = node.schema[KEYWORD];
    if (uniqueItems == null || uniqueItems === false) {
        return;
    }
    if (typeof uniqueItems !== "boolean") {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: uniqueItems,
            message: `Keyword '${KEYWORD}' must be a boolean - received ${typeof uniqueItems}`
        });
    }
    node.uniqueItems = true;
}

function validateUniqueItems({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (!Array.isArray(data)) {
        return undefined;
    }
    const { schema } = node;
    const duplicates: number[] = [];
    const errors: JsonError[] = [];
    data.forEach((item, index) => {
        for (let i = index + 1; i < data.length; i += 1) {
            if (deepEqual(item, data[i]) && !duplicates.includes(i)) {
                errors.push(
                    node.createError("unique-items-error", {
                        pointer: `${pointer}/${i}`,
                        duplicatePointer: `${pointer}/${index}`,
                        arrayPointer: pointer,
                        value: JSON.stringify(item),
                        schema
                    })
                );
                duplicates.push(i);
            }
        }
    });

    return errors;
}
