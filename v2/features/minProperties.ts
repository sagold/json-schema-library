import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function minPropertiesValidator({ draft, schema, validators }: SchemaNode): void {
    if (isNaN(schema.minProperties)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (!isObject(data)) {
            return;
        }
        const propertyCount = Object.keys(data).length;
        if (node.schema.minProperties > propertyCount) {
            return draft.errors.minPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount,
                pointer,
                schema,
                value: data
            });
        }
    });
}
