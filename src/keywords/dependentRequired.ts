import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../Keyword.js";
import { JsonError, SchemaNode } from "../types.js";
import { isObject } from "../utils/isObject.js";

export const dependentRequiredKeyword: Keyword = {
    id: "dependentRequired",
    keyword: "dependentRequired",
    parse: parseDependentRequired,
    addValidate: (node) => isObject(node.schema.dependentRequired),
    validate: validateDependentRequired
};

export function parseDependentRequired(node: SchemaNode) {
    if (!isObject(node.schema.dependentRequired)) {
        return;
    }
    node.dependentRequired = (node.schema.dependentRequired as Record<string, string[]>) ?? {};
}

export function validateDependentRequired({
    node,
    data,
    pointer = "#"
}: JsonSchemaValidatorParams): ValidationResult[] {
    if (!isObject(data)) {
        return undefined;
    }
    const { dependentRequired } = node;
    const errors: JsonError[] = [];
    if (dependentRequired) {
        Object.keys(data).forEach((property) => {
            const dependencies = dependentRequired[property];
            // @draft >= 6 boolean schema
            // @ts-expect-error boolean schema
            if (dependencies === true) {
                return;
            }
            // @ts-expect-error boolean schema
            if (dependencies === false) {
                // @ts-expect-error boolean schema
                errors.push(node.createError("missing-dependency-error", { pointer, schema, value: data }));
                return;
            }
            if (!Array.isArray(dependencies)) {
                return;
            }
            for (let i = 0, l = dependencies.length; i < l; i += 1) {
                if (data[dependencies[i]] === undefined) {
                    errors.push(
                        node.createError("missing-dependency-error", {
                            missingProperty: dependencies[i],
                            pointer,
                            schema: node.schema,
                            value: data
                        })
                    );
                }
            }
        });
    }
    return errors;
}
