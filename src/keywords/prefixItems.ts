import { SchemaNode } from "../types";
import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationReturnType } from "../Keyword";
import { validateNode } from "../validateNode";
import { collectValidationErrors } from "src/utils/collectValidationErrors";

const KEYWORD = "prefixItems";

export const prefixItemsKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseItems,
    addResolve: (node) => node[KEYWORD] != null,
    resolve: prefixItemsResolver,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validatePrefixItems
};

function prefixItemsResolver({ node, key }: JsonSchemaResolverParams) {
    if (node.prefixItems && node.prefixItems[key as number]) {
        return node.prefixItems[key as number];
    }
}

export function parseItems(node: SchemaNode) {
    const { schema, evaluationPath } = node;
    if (Array.isArray(schema.prefixItems)) {
        node.prefixItems = schema.prefixItems.map((itemSchema, index) =>
            node.compileSchema(
                itemSchema,
                `${evaluationPath}/${KEYWORD}/${index}`,
                `${node.schemaLocation}/${KEYWORD}/${index}`
            )
        );
        return collectValidationErrors([], ...node.prefixItems);
    }
}

function validatePrefixItems({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    if (!Array.isArray(data) || data.length === 0) {
        return;
    }

    const errors: ValidationReturnType = [];
    const prefixItems = node[KEYWORD];
    if (prefixItems) {
        // note: schema is valid when data does not have enough elements as defined by array-list
        for (let i = 0; i < Math.min(prefixItems.length, data.length); i += 1) {
            const itemData = data[i];
            // @todo v1 reevaluate: incomplete schema is created here?
            const itemNode = prefixItems[i];
            const result = validateNode(itemNode, itemData, `${pointer}/${i}`, path);
            errors.push(...result);
        }
        return errors;
    }
}
