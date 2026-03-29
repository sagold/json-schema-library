import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { isNumber, SchemaNode } from "../types";

const KEYWORD = "maxItems";

export const maxItemsKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMaxItems,
    addValidate: ({ schema }) => !isNaN(schema.maxItems),
    validate: validateMaxItems
};

function parseMaxItems(node: SchemaNode) {
    const max = node.schema[KEYWORD];
    if (max == null) {
        return;
    }
    if (!isNumber(max)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: max,
            message: `Keyword '${KEYWORD}' must be a number - received '${typeof max}'`
        });
    }
    node[KEYWORD] = max;
}

function validateMaxItems({ node, data, pointer }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (Array.isArray(data) && schema.maxItems < data.length) {
        return node.createError("max-items-error", {
            maximum: schema.maxItems,
            length: data.length,
            schema,
            value: data,
            pointer
        });
    }
}
