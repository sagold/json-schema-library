import { mergeSchema } from "../../lib/mergeSchema";
import { JsonError, JsonSchema } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { Feature, isSchemaNode, JsonSchemaReducerParams, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const dependentSchemasFeature: Feature = {
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
                `${node.spointer}/dependentSchemas/${property}`,
                `${node.schemaId}/dependentSchemas/${property}`
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

    mergedSchema = mergeSchema(node.schema, mergedSchema, "dependentSchemas");
    return node.compileSchema(mergedSchema, node.spointer, node.schemaId);
}

export function validateDependentSchemas({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    const { schema, dependentSchemas } = node;
    if (!isObject(data)) {
        return undefined;
    }
    const errors: JsonError[] = [];
    Object.keys(data).forEach((property) => {
        const dependencies = dependentSchemas[property];
        // @draft >= 6 boolean schema
        if (dependencies === true) {
            return;
        }
        if (dependencies === false) {
            errors.push(node.errors.missingDependencyError({ pointer, schema, value: data }));
            return;
        }
        if (isSchemaNode(dependencies)) {
            errors.push(...dependencies.validate(data, pointer));
            return;
        }
    });
    return errors;
}
