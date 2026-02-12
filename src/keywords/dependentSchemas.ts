import { mergeSchema } from "../utils/mergeSchema";
import { isObject } from "../utils/isObject";
import { isSchemaNode, SchemaNode, JsonSchema } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationAnnotation } from "../Keyword";
import { validateNode } from "../validateNode";
import sanitizeErrors from "../utils/sanitizeErrors";

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

    const parsedSchemas: Record<string, boolean | SchemaNode> = {};
    schemas.forEach((property) => {
        const schema = dependentSchemas[property];
        if (isObject(schema)) {
            parsedSchemas[property] = node.compileSchema(
                schema,
                `${node.evaluationPath}/dependentSchemas/${property}`,
                `${node.schemaLocation}/dependentSchemas/${property}`
            );
        } else if (typeof schema === "boolean") {
            parsedSchemas[property] = schema;
        }
    });
    node.dependentSchemas = parsedSchemas;
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
