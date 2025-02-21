// import getTypeOf from "../../lib/getTypeOf";
// import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

// export function typeArrayValidator({ schema, validators }: SchemaNode): void {
//     if (schema.type !== "array" || (Array.isArray(schema.type) && !schema.type.includes("array"))) {
//         return;
//     }
//     validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
//         const dataType = getTypeOf(data);
//         if (dataType !== "array") {
//             // TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
//             return node.draft.errors.typeError({
//                 value: data,
//                 received: dataType,
//                 expected: "array",
//                 schema,
//                 pointer
//             });
//         }
//     });
// }
