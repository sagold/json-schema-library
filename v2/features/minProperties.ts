import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function minPropertiesValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.minProperties)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (!isObject(data)) {
            return;
        }
        const propertyCount = Object.keys(data).length;
        if (node.schema.minProperties > propertyCount) {
            return node.errors.minPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount,
                pointer,
                schema,
                value: data
            });
        }
    });
}
