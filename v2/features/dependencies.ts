import { JsonError, JsonSchema } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { isSchemaNode, JsonSchemaReducerParams, JsonSchemaValidator } from "../types";
import { getValue } from "../utils/getValue";
import { SchemaNode } from "../types";
import { mergeSchema } from "../../lib/mergeSchema";
import { validateDependentRequired } from "./dependentRequired";

export function parseDependencies(node: SchemaNode) {
    if (!isObject(node.schema.dependencies)) {
        return;
    }

    const { dependencies } = node.schema;

    if (isObject(dependencies)) {
        node.dependentSchemas = {};
        const schemas = Object.keys(dependencies);
        schemas.forEach((property) => {
            const schema = dependencies[property];
            if (isObject(schema)) {
                node.dependentSchemas[property] = node.compileSchema(
                    schema,
                    `${node.spointer}/dependencies/${property}`,
                    `${node.schemaId}/dependencies/${property}`
                );
            } else if (typeof schema === "boolean") {
                node.dependentSchemas[property] = schema;
            }
        });

        if (schemas.length > 0) {
            node.reducers.push(reduceDependentSchemas);
        }

        return;
    }

    if (Array.isArray(dependencies)) {
        node.validators.push(validateDependentRequired);
    }
}

reduceDependentSchemas.toJSON = () => "reduceDependentSchemas";
export function reduceDependentSchemas({ node, data, path }: JsonSchemaReducerParams) {
    if (!isObject(data) || node.dependentSchemas == null) {
        // @todo remove dependentSchemas
        return node;
    }

    let mergedSchema: JsonSchema;
    const { dependentSchemas } = node;
    Object.keys(data).forEach((propertyName) => {
        if (dependentSchemas[propertyName] == null) {
            return;
        }
        mergedSchema = mergedSchema ?? { properties: {} };
        if (isSchemaNode(dependentSchemas[propertyName])) {
            mergedSchema = mergeSchema(mergedSchema, dependentSchemas[propertyName].schema);
        } else {
            mergedSchema.properties[propertyName] = dependentSchemas[propertyName];
        }
    });
    if (mergedSchema == null) {
        return node;
    }

    mergedSchema = mergeSchema(node.schema, mergedSchema, "dependencies");
    return node.compileSchema(mergedSchema, node.spointer).reduce({ data, path });
}

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
