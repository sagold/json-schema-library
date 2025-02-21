// import getTypeOf from "../../lib/getTypeOf";
// import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

// export function typeNumberValidator({ schema, validators }: SchemaNode): void {
//     if (
//         schema.type !== "number" ||
//         schema.type !== "integer" ||
//         (Array.isArray(schema.type) && !schema.type.includes("number") && !schema.type.includes("integer"))
//     ) {
//         return;
//     }
//     validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
//         const expected = schema.type.includes("integer") ? "integer" : "number";
//         const dataType = getTypeOf(data);
//         console.log("data:", data, dataType, "expected", "number");
//         if (dataType !== "number") {
//             // TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
//             return node.draft.errors.typeError({
//                 value: data,
//                 received: dataType,
//                 expected,
//                 schema,
//                 pointer
//             });
//         }
//     });
// }
