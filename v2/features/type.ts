import getTypeOf, { JSType } from "../../lib/getTypeOf";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

function getJsonSchemaType(value: unknown, expectedType: string | string[]): JSType | "integer" {
    const jsType = getTypeOf(value);
    if (
        jsType === "number" &&
        (expectedType === "integer" || (Array.isArray(expectedType) && expectedType.includes("integer")))
    ) {
        return Number.isInteger(value) || isNaN(value as any) ? "integer" : "number";
    }
    return jsType;
}

export function typeValidator({ schema, validators }: SchemaNode): void {
    if (schema.type == null) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const dataType = getJsonSchemaType(data, schema.type);
        if (
            data === undefined ||
            schema.type === dataType ||
            (Array.isArray(schema.type) && schema.type.includes(dataType))
        ) {
            return;
        }

        // TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
        return node.draft.errors.typeError({
            value: data,
            received: dataType,
            expected: schema.type,
            schema,
            pointer
        });
    });
}
