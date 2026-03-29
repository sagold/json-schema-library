import { isBooleanSchema, isJsonSchema, isSchemaNode, SchemaNode } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationAnnotation } from "../Keyword";
import { isObject } from "../utils/isObject";
import { mergeNode } from "../mergeNode";
import { hasProperty } from "../utils/hasProperty";
import { validateDependentRequired } from "./dependentRequired";
import { validateDependentSchemas } from "./dependentSchemas";
import sanitizeErrors from "../utils/sanitizeErrors";
import { isListOfStrings } from "../utils/isListOfStrings";

const KEYWORD = "dependencies";

export const dependenciesKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseDependencies,
    order: -9,
    addReduce: (node) => node.schema[KEYWORD] != null, // because we remap this has to be tested on schema
    reduce: reduceDependencies,
    addValidate: (node) => node.schema[KEYWORD] != null, // because we remap this has to be tested on schema
    validate: validateDependencies
};

export function parseDependencies(node: SchemaNode) {
    const { dependencies } = node.schema;
    if (!isObject(dependencies)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: dependencies,
            message: `Keyword '${KEYWORD}' must be an object - received ${typeof dependencies}`
        });
    }

    const errors: ValidationAnnotation[] = [];
    for (const property of Object.keys(dependencies)) {
        const schema = dependencies[property] as string[];
        if (isJsonSchema(schema) || isBooleanSchema(schema)) {
            node.dependentSchemas = node.dependentSchemas ?? {};
            node.dependentSchemas[property] = node.compileSchema(
                schema,
                `${node.evaluationPath}/${KEYWORD}/${property}`,
                `${node.schemaLocation}/${KEYWORD}/${property}`
            );
        } else if (isListOfStrings(schema)) {
            node.dependentRequired = node.dependentRequired ?? {};
            node.dependentRequired[property] = schema;
        } else {
            errors.push(
                node.createError("schema-error", {
                    pointer: `${node.schemaLocation}/${KEYWORD}`,
                    schema: node.schema,
                    value: dependencies,
                    message: `Keyword '${KEYWORD}[string]' must be JSON Schema or string[]`
                })
            );
        }
    }

    return errors;
}

export function reduceDependencies({ node, data, key, pointer, path }: JsonSchemaReducerParams) {
    if (!isObject(data)) {
        // @todo remove dependentSchemas
        return node;
    }

    if (node.dependentRequired == null && node.dependentSchemas == null) {
        return node;
    }

    let workingNode = node.compileSchema(node.schema, node.evaluationPath, node.schemaLocation);
    let required = workingNode.schema.required ?? [];

    let dynamicId = "";
    const dependentRequired = node.dependentRequired;
    if (dependentRequired) {
        Object.keys(dependentRequired).forEach((propertyName) => {
            if (!hasProperty(data, propertyName) && !required.includes(propertyName)) {
                return;
            }
            if (dependentRequired[propertyName] == null) {
                return;
            }
            required.push(...dependentRequired[propertyName]);

            // @dynamicId
            const localDynamicId = `${KEYWORD}/${propertyName}`;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;
        });
    }

    const dependentSchemas = node.dependentSchemas;
    if (dependentSchemas) {
        Object.keys(dependentSchemas).forEach((propertyName) => {
            if (!hasProperty(data, propertyName) && !required.includes(propertyName)) {
                return true;
            }
            const dependency = dependentSchemas[propertyName];
            if (!isSchemaNode(dependency)) {
                return true;
            }

            if (Array.isArray(dependency.schema.required)) {
                required.push(...dependency.schema.required);
            }

            // @note pass on updated required-list to resolve nested dependencies. This is currently supported,
            // but probably not how json-schema spec defines this behaviour (resolve only within sub-schema)
            const reducedDependency = { ...dependency, schema: { ...dependency.schema, required } }.reduceNode(data, {
                key,
                pointer: `${pointer}/${KEYWORD}/${propertyName}`,
                path
            }).node as SchemaNode;

            workingNode = mergeNode(workingNode, reducedDependency) as SchemaNode;

            // @dynamicId
            const nestedDynamicId = reducedDependency.dynamicId?.replace(node.dynamicId, "") ?? "";
            const localDynamicId = nestedDynamicId === "" ? `${KEYWORD}/${propertyName}` : nestedDynamicId;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;
        });
    }

    if (workingNode === node) {
        return node;
    }

    if (required.length === 0) {
        return workingNode;
    }

    required = workingNode.schema.required ? workingNode.schema.required.concat(...required) : required;
    required = required.filter((r: string, index: number, list: string[]) => list.indexOf(r) === index);
    workingNode = mergeNode(workingNode, workingNode, KEYWORD) as SchemaNode;
    return workingNode.compileSchema(
        { ...workingNode.schema, required },
        workingNode.evaluationPath,
        workingNode.schemaLocation,
        `${node.schemaLocation}(${dynamicId})`
    );
}

function validateDependencies({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return undefined;
    }
    const errors: ValidationAnnotation[] = [];
    if (node.dependentRequired) {
        sanitizeErrors(validateDependentRequired({ node, data, pointer, path }), errors);
    }
    if (node.dependentSchemas) {
        const schemaErrors = validateDependentSchemas({ node, data, pointer, path });
        sanitizeErrors(schemaErrors, errors);
    }
    return errors;
}
