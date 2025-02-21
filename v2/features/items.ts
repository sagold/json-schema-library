import { JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonError } from "../../lib/types";

itemsListResolver.toJSON = () => "itemsListResolver";
function itemsListResolver({ node, key }: JsonSchemaResolverParams) {
    return node.itemsList[key as number];
}

itemsObjectResolver.toJSON = () => "itemsObjectResolver";
function itemsObjectResolver({ node }: JsonSchemaResolverParams) {
    return node.itemsObject;
}

export function parseItems(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (isObject(schema.items)) {
        const propertyNode = node.compileSchema(draft, schema.items, `${spointer}/items`, node);
        node.itemsObject = propertyNode;
        node.resolvers.push(itemsObjectResolver);
    } else if (Array.isArray(schema.items)) {
        node.itemsList = schema.items.map((itemSchema, index) =>
            node.compileSchema(draft, itemSchema, `${spointer}/items/${index}`, node)
        );
        node.resolvers.push(itemsListResolver);
    }
}

export function itemsValidator({ schema, validators }: SchemaNode) {
    if (schema.items == null) {
        return;
    }

    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams): JsonError | JsonError[] | undefined => {
        if (!Array.isArray(data)) {
            return;
        }

        // @draft >= 7 bool schema
        if (schema.items === false) {
            if (Array.isArray(data) && data.length === 0) {
                return undefined;
            }
            return node.draft.errors.invalidDataError({ pointer, value: data, schema });
        }

        const errors: JsonError[] = [];

        if (node.itemsList) {
            for (let i = 0; i < node.itemsList.length; i += 1) {
                const itemData = data[i];
                // @todo reevaluate: incomplete schema is created here
                const itemNode = node.itemsList[i];
                // @todo check mismatch in length
                // what about additionalItems??
                // => const itemNode = draft.step(node.next(schema), i, value);
                const result = itemNode.validate(itemData, `${pointer}/${i}`);
                if (result) {
                    errors.push(...result);
                }
            }
        } else if (node.itemsObject) {
            for (let i = 0; i < data.length; i += 1) {
                const itemData = data[i];
                const result = node.itemsObject.validate(itemData, `${pointer}/${i}`);
                if (result) {
                    errors.push(...result);
                }
            }
        }

        return errors;
    });
}
