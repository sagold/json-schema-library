import { collectValidationErrors } from "src/utils/collectValidationErrors";
import {
    Keyword,
    JsonSchemaValidatorParams,
    JsonSchemaReducerParams,
    ValidationReturnType,
    ValidationAnnotation
} from "../Keyword";
import { isBooleanSchema, isJsonSchema, SchemaNode } from "../types";
import { hasProperty } from "../utils/hasProperty";
import { isObject } from "../utils/isObject";
import { mergeSchema } from "../utils/mergeSchema";
import sanitizeErrors from "../utils/sanitizeErrors";
import { validateNode } from "../validateNode";

const KEYWORD = "propertyDependencies";

function findMatchingSchemata(node: SchemaNode, data: Record<string, unknown>) {
    const dependentProperties = node[KEYWORD];
    if (dependentProperties == null) {
        return undefined;
    }
    const dependentPropertyNames = Object.keys(dependentProperties);
    const matchingSchemata: { property: string; value: string; node: SchemaNode }[] = [];
    for (const propertyName of dependentPropertyNames) {
        if (hasProperty(data, propertyName)) {
            const value = data[propertyName];
            if (dependentProperties[propertyName][value as string]) {
                matchingSchemata.push({
                    property: propertyName,
                    value: `${value}`,
                    node: dependentProperties[propertyName][value as string]
                });
            }
        }
    }
    return matchingSchemata;
}

/**
 * @experimental `propertyDependencies` to resolve schema by nested name and value
 * @reference https://docs.google.com/presentation/d/1ajXlCQcsjjiMLsluFIILR7sN5aDRBnfqQ9DLbcFbqjI/mobilepresent?slide=id.p
 *
 * - matching schemas are resolved and validiated
 * - multiple matching schemas are resolved and validiated
 * - ignores keyword if no schema is matched
 *
 * @example
 * {
 *   type: "object",
 *   propertyDependencies: {
 *      propertyName: {
 *          propertyValue: { $ref: "#/$defs/schema" }
 *      }
 *   }
 * }
 *
 * matches
 *
 * {
 *   "propertyName": "propertyValue",
 *   "otherData": 123
 * } with "#/$defs/schema"
 */
export const propertyDependenciesKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parsePropertyDependencies,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validatePropertyDependencies,
    addReduce: (node) => node[KEYWORD] != null,
    reduce: reducePropertyDependencies
};

function parsePropertyDependencies(node: SchemaNode) {
    const propertyDependencies = node.schema[KEYWORD];
    if (!isObject(propertyDependencies)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: propertyDependencies,
            message: `Keyword '${KEYWORD}' must be an object - received '${typeof propertyDependencies}'`
        });
    }
    const parsed: Record<string, Record<string, SchemaNode>> = {};
    const errors: ValidationAnnotation[] = [];
    Object.keys(propertyDependencies).map((propertyName) => {
        const values = propertyDependencies[propertyName];
        if (!isObject(values)) {
            errors.push(
                node.createError("schema-error", {
                    pointer: `${node.schemaLocation}/${KEYWORD}/${propertyName}`,
                    schema: node.schema,
                    value: propertyDependencies,
                    message: `Keyword '${KEYWORD}[string]' must be an object - received '${typeof propertyDependencies}'`
                })
            );
            return;
        }
        Object.keys(values).forEach((value) => {
            const schema = values[value];
            if (!(isJsonSchema(schema) || isBooleanSchema(schema))) {
                errors.push(
                    node.createError("schema-error", {
                        pointer: `${node.schemaLocation}/${KEYWORD}/${propertyName}/${value}`,
                        schema: node.schema,
                        value: schema,
                        message: `Keyword '${KEYWORD}[string][string]' must be a valid JSON Schema - received '${typeof schema}'`
                    })
                );
                return;
            }
            parsed[propertyName] = parsed[propertyName] ?? {};
            parsed[propertyName][value] = node.compileSchema(
                schema,
                `${node.evaluationPath}/${KEYWORD}/${propertyName}/${value}`,
                `${node.schemaLocation}/${KEYWORD}/${propertyName}/${value}`
            );
            collectValidationErrors(errors, parsed[propertyName][value]);
        });
    });
    node[KEYWORD] = parsed;
    return errors;
}

function validatePropertyDependencies({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return undefined;
    }
    const matchingSchemata = findMatchingSchemata(node, data);
    if (matchingSchemata == null || matchingSchemata.length === 0) {
        return undefined;
    }
    const errors: ValidationReturnType[] = [];
    for (const match of matchingSchemata) {
        const result = validateNode(match.node, data, pointer, path);
        errors.push(result);
    }
    return sanitizeErrors(errors);
}

function reducePropertyDependencies({ node, data, key, pointer, path }: JsonSchemaReducerParams) {
    if (!isObject(data)) {
        return undefined;
    }
    const matchingSchemata = findMatchingSchemata(node, data);
    if (matchingSchemata == null || matchingSchemata.length === 0) {
        return undefined;
    }

    let mergedSchema = {};
    let dynamicId = "";
    for (const match of matchingSchemata) {
        const { node: schemaNode } = match.node.reduceNode(data, { key, pointer, path });
        if (schemaNode) {
            const nestedDynamicId = schemaNode.dynamicId?.replace(node.dynamicId, "") ?? "";
            const localDynamicId =
                nestedDynamicId === "" ? `propertyDependencies/${match.property}/${match.value}` : nestedDynamicId;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;

            const schema = mergeSchema(match.node.schema, schemaNode.schema);
            mergedSchema = mergeSchema(mergedSchema, schema, "propertyDependencies");
        }
    }

    return node.compileSchema(
        mergedSchema,
        `${node.evaluationPath}/${dynamicId}`,
        node.schemaLocation,
        `${node.schemaLocation}(${dynamicId})`
    );
}
