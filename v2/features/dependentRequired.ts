import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function dependentRequiredValidator(node: SchemaNode): void {
    if (!isObject(node.schema.dependentRequired)) {
        return undefined;
    }

    node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { schema } = node;
        const dependentRequired = schema.dependentRequired;
        if (!isObject(data)) {
            return undefined;
        }
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
    });
}
