import { JsonError } from "../../../lib/types";
import { isObject } from "../../../lib/utils/isObject";
import { JsonSchemaValidator } from "../../types";
import { getValue } from "../../utils/getValue";
import { SchemaNode } from "../../types";

export function dependenciesValidator(node: SchemaNode): void {
    if (!isObject(node.schema.dependencies)) {
        return undefined;
    }
    node.validators.push(validateDependencies);
}

const validateDependencies: JsonSchemaValidator = ({ node, data, pointer = "#" }) => {
    if (!isObject(data)) {
        return undefined;
    }

    const errors: JsonError[] = [];
    const dependencies = node.schema.dependencies;
    Object.keys(data).forEach((property) => {
        if (dependencies[property] === undefined) {
            return;
        }
        // @draft >= 6 boolean schema
        if (dependencies[property] === true) {
            return;
        }
        if (dependencies[property] === false) {
            errors.push(node.errors.missingDependencyError({ pointer, schema: node.schema, value: data }));
            return;
        }
        let dependencyErrors;
        const isObjectDependency = isObject(dependencies[property]);
        const propertyValue = dependencies[property];
        if (Array.isArray(propertyValue)) {
            dependencyErrors = propertyValue
                .filter((dependency: any) => getValue(data, dependency) === undefined)
                .map((missingProperty: any) =>
                    node.errors.missingDependencyError({ missingProperty, pointer, schema: node.schema, value: data })
                );
        } else if (isObjectDependency) {
            // @todo precompile
            const nextNode = node.compileSchema(dependencies[property], `${node.spointer}/dependencies/${property}`);
            dependencyErrors = nextNode.validate(data);
        } else {
            throw new Error(`Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`);
        }

        errors.push(...dependencyErrors);
    });
    return errors;
};
