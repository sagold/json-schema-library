// import getTypeOf from "../../lib/getTypeOf";
// import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

// export function typeNullValidator({ schema, validators }: SchemaNode): void {
//     if (schema.type !== "null" || (Array.isArray(schema.type) && !schema.type.includes("null"))) {
//         return;
//     }
//     validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
//         if (data !== null) {
//             // TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
//             return node.draft.errors.typeError({
//                 value: data,
//                 received: getTypeOf(data),
//                 expected: "null",
//                 schema,
//                 pointer
//             });
//         }
//     });
// }
