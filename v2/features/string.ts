import getTypeOf from "../../lib/getTypeOf";
import ucs2decode from "../../lib/utils/punycode.ucs2decode";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function getStringData(node: SchemaNode) {
    if (node.schema.type === "string") {
        node.getDefaultData.push(({ data, node }) => {
            return data ?? node.schema.default;
        });
    }
}

// export function typeStringValidator({ schema, validators }: SchemaNode): void {
//     if (schema.type !== "string" || (Array.isArray(schema.type) && !schema.type.includes("string"))) {
//         return;
//     }
//     validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
//         const dataType = getTypeOf(data);
//         if (dataType !== "string") {
//             // TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
//             return node.draft.errors.typeError({
//                 value: data,
//                 received: dataType,
//                 expected: "string",
//                 schema,
//                 pointer
//             });
//         }
//     });
// }

export function maxLengthValidator({ schema, draft, validators }: SchemaNode): void {
    if (isNaN(schema.maxLength)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (typeof data !== "string") {
            return;
        }

        const { schema } = node;
        const length = ucs2decode(data).length;
        if (schema.maxLength < length) {
            return draft.errors.maxLengthError({
                maxLength: schema.maxLength,
                length,
                pointer,
                schema,
                value: data
            });
        }
    });
}

export function minLengthValidator({ schema, draft, validators }: SchemaNode): void {
    if (isNaN(schema.minLength)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (typeof data !== "string") {
            return;
        }
        const { schema } = node;
        const length = ucs2decode(data).length;
        if (schema.minLength <= length) {
            return;
        }
        if (schema.minLength === 1) {
            return draft.errors.minLengthOneError({
                minLength: schema.minLength,
                length,
                pointer,
                schema,
                value: data
            });
        }
        return draft.errors.minLengthError({
            minLength: schema.minLength,
            length,
            pointer,
            schema,
            value: data
        });
    });
}
