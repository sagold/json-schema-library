import { isSchemaNode, SchemaNode } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { getValue } from "../utils/getValue";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";
import { mergeNode } from "../mergeNode";

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

export function reduceDependencies({ node, data, key, path }: JsonSchemaReducerParams) {
    if (!isObject(data) || node.dependencies == null) {
        // @todo remove dependentSchemas
        return node;
    }

    let workingNode = node.compileSchema(node.schema, node.spointer, node.schemaId);
    const { dependencies } = node;
    let required = workingNode.schema.required ?? [];
    Object.keys(dependencies).forEach((propertyName) => {
        if (isSchemaNode(dependencies[propertyName])) {
            const reducedDependency = dependencies[propertyName].reduceNode(data, { key, path }).node;
            workingNode = mergeNode(workingNode, reducedDependency);
        } else if (Array.isArray(dependencies[propertyName]) && data[propertyName] !== undefined) {
            required.push(...dependencies[propertyName]);
        }
    });

    if (workingNode === node) {
        return node;
    }

    // mergedSchema = mergeSchema(node.schema, mergedSchema, "dependencies");
    // const { node: childNode, error } = node.compileSchema(mergedSchema, node.spointer).reduceNode(data, { path });
    // return childNode ?? error;

    if (required.length === 0) {
        return workingNode;
    }

    required = workingNode.schema.required ? workingNode.schema.required.concat(...required) : required;
    return workingNode.compileSchema({ ...workingNode.schema, required }, workingNode.spointer, workingNode.schemaId);
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
            errors.push(node.createError("missing-dependency-error", { pointer, schema: node.schema, value: data }));
            return;
        }

        if (Array.isArray(propertyValue)) {
            propertyValue
                .filter((dependency: any) => getValue(data, dependency) === undefined)
                .forEach((missingProperty: any) =>
                    errors.push(
                        node.createError("missing-dependency-error", {
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
