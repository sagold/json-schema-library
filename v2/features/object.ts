import getTypeOf from "../../lib/getTypeOf";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import { getValue } from "../utils/getValue";

export function getObjectData(node: SchemaNode) {
    if (node.schema.type === "object") {
        node.getDefaultData.push(({ data, node }) => {
            const templateData: Record<string, any> = node.schema.default ?? data ?? {};
            if (node.properties) {
                Object.keys(node.properties).forEach((propertyName) => {
                    templateData[propertyName] = node.properties[propertyName].getTemplate(
                        getValue(templateData, propertyName)
                    );
                });
            }
            return templateData;
        });
    }
}

// export function typeObjectValidator({ schema, validators }: SchemaNode): void {
//     if (schema.type !== "object" || (Array.isArray(schema.type) && !schema.type.includes("object"))) {
//         return;
//     }
//     validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
//         const dataType = getTypeOf(data);
//         if (dataType !== "object") {
//             // TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
//             return node.draft.errors.typeError({
//                 value: data,
//                 received: dataType,
//                 expected: "object",
//                 schema,
//                 pointer
//             });
//         }
//     });
// }

export function maxPropertiesValidator({ schema, draft, validators }: SchemaNode): void {
    if (isNaN(schema.maxProperties)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (!isObject(data)) {
            return;
        }

        const { schema } = node;
        const propertyCount = Object.keys(data).length;
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return draft.errors.maxPropertiesError({
                maxProperties: schema.maxProperties,
                length: propertyCount,
                pointer,
                schema,
                value: data
            });
        }
    });
}

export function minPropertiesValidator({ draft, schema, validators }: SchemaNode): void {
    if (isNaN(schema.minProperties)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (!isObject(data)) {
            return;
        }
        const propertyCount = Object.keys(data).length;
        if (node.schema.minProperties > propertyCount) {
            return draft.errors.minPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount,
                pointer,
                schema,
                value: data
            });
        }
    });
}
