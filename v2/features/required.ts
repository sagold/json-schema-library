import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../types";
import { hasProperty } from "../utils/hasProperty";

export function requiredValidator({ schema, validators }: SchemaNode): void {
    if (!Array.isArray(schema.required)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (!Array.isArray(schema.required) || !isObject(data)) {
            return undefined;
        }

        return schema.required.map((property: string) => {
            if (!hasProperty(data, property)) {
                return draft.errors.requiredPropertyError({
                    key: property,
                    pointer,
                    schema,
                    value: data
                });
            }
            return undefined;
        });
    });
}
