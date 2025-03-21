import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../types";
import { hasProperty } from "../utils/hasProperty";

export function requiredValidator({ schema, validators }: SchemaNode): void {
    if (Array.isArray(schema.required)) {
        validators.push(validateRequired);
    }
}

validateRequired.toJSON = () => "required";
function validateRequired({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (!Array.isArray(schema.required) || !isObject(data)) {
        return undefined;
    }

    return schema.required.map((property: string) => {
        if (!hasProperty(data, property)) {
            return node.errors.requiredPropertyError({
                key: property,
                pointer,
                schema,
                value: data
            });
        }
        return undefined;
    });
}
