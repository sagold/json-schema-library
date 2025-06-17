import { mergeSchema } from "../utils/mergeSchema.js";
import { isObject } from "../utils/isObject.js";
import { isSchemaNode, SchemaNode, JsonSchema } from "../types.js";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword.js";
import { validateNode } from "../validateNode.js";

export const dependentSchemasKeyword: Keyword = {
    id: "dependentSchemas",
    keyword: "dependentSchemas",
    parse: parseDependentSchemas,
    addReduce: (node) => node.dependentSchemas != null,
    reduce: reduceDependentSchemas,
    addValidate: (node) => node.dependentSchemas != null,
    validate: validateDependentSchemas
};

export function parseDependentSchemas(node: SchemaNode) {
    const { dependentSchemas } = node.schema;
    if (!isObject(dependentSchemas)) {
        return;
    }

    const schemas = Object.keys(dependentSchemas);
    if (schemas.length === 0) {
        return;
    }

    node.dependentSchemas = {};
    schemas.forEach((property) => {
        const schema = dependentSchemas[property];
        if (isObject(schema)) {
            node.dependentSchemas[property] = node.compileSchema(
                schema,
                `${node.evaluationPath}/dependentSchemas/${property}`,
                `${node.schemaLocation}/dependentSchemas/${property}`
            );
        } else if (typeof schema === "boolean") {
            node.dependentSchemas[property] = schema;
        }
    });
}

export function reduceDependentSchemas({ node, data }: JsonSchemaReducerParams) {
    if (!isObject(data)) {
        // @todo remove dependentSchemas
        return node;
    }

    let mergedSchema: JsonSchema;
    const { dependentSchemas } = node;
    let added = 0;
    let dynamicId = `${node.schemaLocation}(`;
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
        dynamicId += `${added ? "," : ""}dependentSchemas/${propertyName}`;
        added++;
    });

    if (mergedSchema == null) {
        return node;
    }

    mergedSchema = mergeSchema(node.schema, mergedSchema, "dependentSchemas");
    return node.compileSchema(mergedSchema, node.evaluationPath, node.schemaLocation, `${dynamicId})`);
}

export function validateDependentSchemas({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    const { schema, dependentSchemas } = node;
    if (!isObject(data) || dependentSchemas == null) {
        return undefined;
    }
    const errors: ValidationResult[] = [];
    Object.keys(data).forEach((property) => {
        const dependencies = dependentSchemas[property];
        // @draft >= 6 boolean schema
        if (dependencies === true) {
            return;
        }
        if (dependencies === false) {
            errors.push(node.createError("missing-dependency-error", { pointer, schema, value: data }));
            return;
        }
        if (isSchemaNode(dependencies)) {
            errors.push(...validateNode(dependencies, data, pointer, path));
            return;
        }
    });
    return errors;
}
