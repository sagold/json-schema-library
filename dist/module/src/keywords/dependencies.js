import { isSchemaNode } from "../types";
import { getValue } from "../utils/getValue";
import { isObject } from "../utils/isObject";
import { mergeSchema } from "../utils/mergeSchema";
import { validateNode } from "../validateNode";
export const dependenciesKeyword = {
    id: "dependencies",
    keyword: "dependencies",
    parse: parseDependencies,
    addReduce: (node) => node.dependencies != null,
    reduce: reduceDependencies,
    addValidate: (node) => node.dependencies != null,
    validate: validateDependencies
};
export function parseDependencies(node) {
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
            schema, `${node.spointer}/dependencies/${property}`, `${node.schemaId}/dependencies/${property}`);
        }
        else if (Array.isArray(schema)) {
            node.dependencies[property] = schema;
        }
    });
}
export function reduceDependencies({ node, data, path }) {
    if (!isObject(data) || node.dependencies == null) {
        // @todo remove dependentSchemas
        return node;
    }
    let mergedSchema;
    const { dependencies } = node;
    Object.keys(dependencies).forEach((propertyName) => {
        var _a;
        mergedSchema = mergedSchema !== null && mergedSchema !== void 0 ? mergedSchema : { properties: {} };
        if (isSchemaNode(dependencies[propertyName])) {
            mergedSchema = mergeSchema(mergedSchema, dependencies[propertyName].schema);
        }
        else if (Array.isArray(dependencies[propertyName]) && data[propertyName] !== undefined) {
            mergedSchema.required = (_a = mergedSchema.required) !== null && _a !== void 0 ? _a : [];
            mergedSchema.required.push(...dependencies[propertyName]);
        }
    });
    if (mergedSchema == null) {
        return node;
    }
    mergedSchema = mergeSchema(node.schema, mergedSchema, "dependencies");
    const { node: childNode, error } = node.compileSchema(mergedSchema, node.spointer).reduceSchema(data, { path });
    return childNode !== null && childNode !== void 0 ? childNode : error;
}
function validateDependencies({ node, data, pointer, path }) {
    if (!isObject(data)) {
        return undefined;
    }
    const errors = [];
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
                .filter((dependency) => getValue(data, dependency) === undefined)
                .forEach((missingProperty) => errors.push(node.createError("MissingDependencyError", {
                missingProperty,
                pointer: `${pointer}/${missingProperty}`,
                schema: node.schema,
                value: data
            })));
        }
        else if (isSchemaNode(propertyValue)) {
            errors.push(...validateNode(propertyValue, data, pointer, path));
        }
        else {
            throw new Error(`Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`);
        }
    });
    return errors;
}
