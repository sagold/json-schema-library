import { JsonSchemaValidatorParams, SchemaNode } from "../types";
import getTypeOf from "../../lib/getTypeOf";

export function enumValidator({ schema, validators }: SchemaNode): void {
    if (!Array.isArray(schema.enum)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (!Array.isArray(schema.enum)) {
            return undefined;
        }

        const type = getTypeOf(data);
        if (type === "object" || type === "array") {
            const valueStr = JSON.stringify(data);
            for (let i = 0; i < schema.enum.length; i += 1) {
                if (JSON.stringify(schema.enum[i]) === valueStr) {
                    return undefined;
                }
            }
        } else if (schema.enum.includes(data)) {
            return undefined;
        }

        return draft.errors.enumError({
            pointer,
            schema,
            value: data
        });
    });
}
