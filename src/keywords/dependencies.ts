import { isSchemaNode, JsonSchema, SchemaNode } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { getValue } from "../utils/getValue";
import { isObject } from "../utils/isObject";
import { mergeSchema } from "../utils/mergeSchema";
import { validateNode } from "../validateNode";

export const dependenciesKeyword: Keyword = {
    id: "dependencies",
    keyword: "dependencies",
    parse: parseDependencies,
    addReduce: (node) => node.dependencies != null,
    reduce: reduceDependencies,
    addValidate: (node) => node.dependencies != null,
    validate: validateDependencies
};

export function parseDependencies(node: SchemaNode) {
    const { dependencies } = node.schema;
    if (!isObject(dependencies)) {
        return;
    }

    const schemas = Object.keys(dependencies);
    if (schemas.length === 0) {
        return;
    }
    node.dependencies = {};
    schemas.forEach((property) => {
        const schema = dependencies[property];
        if (isObject(schema) || typeof schema === "boolean") {
            node.dependencies[property] = node.compileSchema(
                // @ts-expect-error boolean schema
                schema,
                `${node.spointer}/dependencies/${property}`,
                `${node.schemaId}/dependencies/${property}`
            );
        } else if (Array.isArray(schema)) {
            node.dependencies[property] = schema;
        }
    });
}

export function reduceDependencies({ node, data, path }: JsonSchemaReducerParams) {
    if (!isObject(data) || node.dependencies == null) {
        // @todo remove dependentSchemas
        return node;
    }

    let mergedSchema: JsonSchema;
    const { dependencies } = node;
    Object.keys(dependencies).forEach((propertyName) => {
        mergedSchema = mergedSchema ?? { properties: {} };
        if (isSchemaNode(dependencies[propertyName])) {
            mergedSchema = mergeSchema(mergedSchema, dependencies[propertyName].schema);
        } else if (Array.isArray(dependencies[propertyName]) && data[propertyName] !== undefined) {
            mergedSchema.required = mergedSchema.required ?? [];
            mergedSchema.required.push(...dependencies[propertyName]);
        }
    });

    if (mergedSchema == null) {
        return node;
    }

    mergedSchema = mergeSchema(node.schema, mergedSchema, "dependencies");
    const { node: childNode, error } = node.compileSchema(mergedSchema, node.spointer).reduceSchema(data, { path });
    return childNode ?? error;
}

function validateDependencies({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return undefined;
    }

    const errors: ValidationResult[] = [];
    const dependencies = node.dependencies;
    Object.keys(data).forEach((property) => {
        const propertyValue = dependencies[property];
        if (propertyValue === undefined) {
            return;
        }
        // @draft >= 6 boolean schema
        if (propertyValue === true) {
            return;
        }
        if (propertyValue === false) {
            errors.push(node.createError("MissingDependencyError", { pointer, schema: node.schema, value: data }));
            return;
        }

        if (Array.isArray(propertyValue)) {
            propertyValue
                .filter((dependency: any) => getValue(data, dependency) === undefined)
                .forEach((missingProperty: any) =>
                    errors.push(
                        node.createError("MissingDependencyError", {
                            missingProperty,
                            pointer: `${pointer}/${missingProperty}`,
                            schema: node.schema,
                            value: data
                        })
                    )
                );
        } else if (isSchemaNode(propertyValue)) {
            errors.push(...validateNode(propertyValue, data, pointer, path));
        } else {
            throw new Error(`Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`);
        }
    });
    return errors;
}
