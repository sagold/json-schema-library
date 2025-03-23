import { isObject } from "../../lib/utils/isObject";
import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const containsFeature: Feature = {
    id: "contains",
    keyword: "contains",
    parse: parseContains,
    addValidate: (node) => node.contains != null,
    validate: validateContains
};

export function parseContains(node: SchemaNode) {
    const { schema, spointer } = node;
    if (schema.contains == null) {
        return;
    }
    node.contains = node.compileSchema(schema.contains, `${spointer}/contains`);
}

// @todo this combines multiple validators (maxContains and minContains)
export function containsValidator(node: SchemaNode): void {
    if (containsFeature.addValidate(node)) {
        node.validators.push(containsFeature.validate);
    }
}

function validateContains({ node, data, pointer }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (!Array.isArray(data)) {
        return;
    }
    if (schema.contains === false) {
        return node.errors.containsArrayError({ pointer, value: data, schema });
    }

    if (schema.contains === true) {
        if (Array.isArray(data) && data.length === 0) {
            return node.errors.containsAnyError({ pointer, value: data, schema });
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
        return node.errors.containsMaxError({ pointer, schema, delta: count - max, value: data });
    }
    if (min > count) {
        return node.errors.containsMinError({ pointer, schema, delta: min - count, value: data });
    }
    return node.errors.containsError({ pointer, schema, value: data });
}
