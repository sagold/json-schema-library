// import getTypeOf from "../../lib/getTypeOf";
// import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

// export function typeBooleanValidator({ schema, validators }: SchemaNode): void {
//     if (schema.type !== "boolean" || (Array.isArray(schema.type) && !schema.type.includes("boolean"))) {
//         return;
//     }
//     validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
//         const dataType = getTypeOf(data);
//         if (dataType !== "boolean") {
//             // TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
//             return node.draft.errors.typeError({
//                 value: data,
//                 received: dataType,
//                 expected: "boolean",
//                 schema,
//                 pointer
//             });
//         }
//     });
// }
