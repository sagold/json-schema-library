import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function parseContains(node: SchemaNode) {
    const { schema, spointer } = node;
    if (schema.contains == null) {
        return;
    }
    // @todo immediately compile if no resolvers are added
    node.contains = node.compileSchema(schema.contains, `${spointer}/contains`);
}

// @todo this combines multiple validators (maxContains and minContains)
export function containsValidator({ schema, validators }: SchemaNode): void {
    if (schema.contains == null) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (!Array.isArray(data)) {
            return;
        }
        if (schema.contains === false) {
            return draft.errors.containsArrayError({ pointer, value: data, schema });
        }

        if (schema.contains === true) {
            if (Array.isArray(data) && data.length === 0) {
                return draft.errors.containsAnyError({ pointer, value: data, schema });
            }
            return undefined;
        }

        if (!isObject(schema.contains) || !Array.isArray(data)) {
            // - ignore invalid schema
            // - ignore invalid dara
            return undefined;
        }

        let count = 0;
        for (let i = 0; i < data.length; i += 1) {
            if (node.contains.validate(data[i]).length === 0) {
                count++;
            }
        }

        // @draft >= 2019-09
        const max = schema.maxContains ?? Infinity;
        const min = schema.minContains ?? 1;
        if (max >= count && min <= count) {
            return undefined;
        }
        if (max < count) {
            return draft.errors.containsMaxError({ pointer, schema, delta: count - max, value: data });
        }
        if (min > count) {
            return draft.errors.containsMinError({ pointer, schema, delta: min - count, value: data });
        }
        return draft.errors.containsError({ pointer, schema, value: data });
    });
}
