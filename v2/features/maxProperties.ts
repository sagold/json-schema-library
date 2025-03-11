import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function maxPropertiesValidator({ schema, validators }: SchemaNode): void {
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
            return node.errors.maxPropertiesError({
                maxProperties: schema.maxProperties,
                length: propertyCount,
                pointer,
                schema,
                value: data
            });
        }
    });
}
