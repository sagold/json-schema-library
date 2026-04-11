import { mergeSchema } from "../utils/mergeSchema";
import { isObject } from "../utils/isObject";
import { isSchemaNode, SchemaNode, JsonSchema, isBooleanSchema } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationAnnotation } from "../Keyword";
import { validateNode } from "../validateNode";
import sanitizeErrors from "../utils/sanitizeErrors";
import { collectValidationErrors } from "src/utils/collectValidationErrors";

const KEYWORD = "dependentSchemas";

export const dependentSchemasKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseDependentSchemas,
    addReduce: (node) => node.dependentSchemas != null,
    reduce: reduceDependentSchemas,
    addValidate: (node) => node.dependentSchemas != null,
    validate: validateDependentSchemas
};

export function parseDependentSchemas(node: SchemaNode) {
    const { dependentSchemas } = node.schema;
    if (dependentSchemas == null) {
        return;
    }
    if (!isObject(dependentSchemas)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: dependentSchemas,
            message: `Keyword '${KEYWORD}' must be an object - received '${typeof dependentSchemas}'`
        });
    }

    const dependentProperties = Object.keys(dependentSchemas);
    if (dependentProperties.length === 0) {
        return;
    }

    const errors: ValidationAnnotation[] = [];
    const parsedSchemas: Record<string, boolean | SchemaNode> = {};
    for (const property of Object.keys(dependentSchemas)) {
        const schema = dependentSchemas[property];
        if (isObject(schema)) {
            parsedSchemas[property] = node.compileSchema(
                schema,
                `${node.evaluationPath}/${KEYWORD}/${property}`,
                `${node.schemaLocation}/${KEYWORD}/${property}`
            );
            collectValidationErrors(errors, parsedSchemas[property]);
        } else if (isBooleanSchema(schema)) {
            parsedSchemas[property] = schema;
        } else {
            errors.push(
                node.createError("schema-error", {
                    pointer: `${node.schemaLocation}/${KEYWORD}/${property}`,
                    schema: node.schema,
                    value: schema,
                    message: `Keyword '${KEYWORD}[string]' must be a valid JSON Schema'`
                })
            );
        }
    }
    node.dependentSchemas = parsedSchemas;
    return errors;
}

export function reduceDependentSchemas({ node, data }: JsonSchemaReducerParams) {
    const { dependentSchemas } = node;
    if (!isObject(data) || dependentSchemas == null) {
        // @todo remove dependentSchemas
        return node;
    }

    let mergedSchema: JsonSchema | undefined;
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
        dynamicId += `${added ? "," : ""}${KEYWORD}/${propertyName}`;
        added++;
    });

    if (mergedSchema == null) {
        return node;
    }

    mergedSchema = mergeSchema(node.schema, mergedSchema, KEYWORD);
    return node.compileSchema(mergedSchema, node.evaluationPath, node.schemaLocation, `${dynamicId})`);
}

export function validateDependentSchemas({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    const { schema, dependentSchemas } = node;
    if (!isObject(data) || dependentSchemas == null) {
        return undefined;
    }
    const errors: ValidationAnnotation[] = [];
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
            sanitizeErrors(validateNode(dependencies, data, pointer, path), errors);
            return;
        }
    });
    return errors;
}
