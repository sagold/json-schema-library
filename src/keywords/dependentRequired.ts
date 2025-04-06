import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { JsonError } from "../types";
import { isObject } from "../utils/isObject";

export const dependentRequiredKeyword: Keyword = {
    id: "dependentRequired",
    keyword: "dependentRequired",
    addValidate: (node) => isObject(node.schema.dependentRequired),
    validate: validateDependentRequired
};

export function validateDependentRequired({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return undefined;
    }
    const { schema } = node;
    const dependentRequired = schema.dependentRequired;
    const errors: JsonError[] = [];
    Object.keys(data).forEach((property) => {
        const dependencies = dependentRequired[property];
        // @draft >= 6 boolean schema
        if (dependencies === true) {
            return;
        }
        if (dependencies === false) {
            errors.push(node.errors.missingDependencyError({ pointer, schema, value: data }));
            return;
        }
        if (!Array.isArray(dependencies)) {
            return;
        }
        for (let i = 0, l = dependencies.length; i < l; i += 1) {
            if (data[dependencies[i]] === undefined) {
                errors.push(
                    node.errors.missingDependencyError({
                        missingProperty: dependencies[i],
                        pointer,
                        schema,
                        value: data
                    })
                );
            }
        }
    });
    return errors;
}
