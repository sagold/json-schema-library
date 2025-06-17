import { isSchemaNode, SchemaNode } from "../types.js";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword.js";
import { isObject } from "../utils/isObject.js";
import { mergeNode } from "../mergeNode.js";
import { hasProperty } from "../utils/hasProperty.js";
import { validateDependentRequired } from "./dependentRequired.js";
import { validateDependentSchemas } from "./dependentSchemas.js";

export const dependenciesKeyword: Keyword = {
    id: "dependencies",
    keyword: "dependencies",
    parse: parseDependencies,
    order: -9,
    addReduce: (node) => node.schema.dependencies != null,
    reduce: reduceDependencies,
    addValidate: (node) => node.schema.dependencies != null,
    validate: validateDependencies
};

export function parseDependencies(node: SchemaNode) {
    const { dependencies } = node.schema;
    if (!isObject(dependencies)) {
        return;
    }
    const schemas = Object.keys(dependencies);
    schemas.forEach((property) => {
        const schema = dependencies[property] as string[];
        if (isObject(schema) || typeof schema === "boolean") {
            node.dependentSchemas = node.dependentSchemas ?? {};
            node.dependentSchemas[property] = node.compileSchema(
                schema,
                `${node.evaluationPath}/dependencies/${property}`,
                `${node.schemaLocation}/dependencies/${property}`
            );
        } else {
            node.dependentRequired = node.dependentRequired ?? {};
            node.dependentRequired[property] = schema;
        }
    });
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
    if (node.dependentRequired) {
        Object.keys(node.dependentRequired).forEach((propertyName) => {
            if (!hasProperty(data, propertyName) && !required.includes(propertyName)) {
                return;
            }
            if (node.dependentRequired[propertyName] == null) {
                return;
            }
            required.push(...node.dependentRequired[propertyName]);

            // @dynamicId
            const localDynamicId = `dependencies/${propertyName}`;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;
        });
    }

    if (node.dependentSchemas) {
        Object.keys(node.dependentSchemas).forEach((propertyName) => {
            if (!hasProperty(data, propertyName) && !required.includes(propertyName)) {
                return true;
            }
            const dependency = node.dependentSchemas[propertyName];
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
                pointer: `${pointer}/dependencies/${propertyName}`,
                path
            }).node;

            workingNode = mergeNode(workingNode, reducedDependency);

            // @dynamicId
            const nestedDynamicId = reducedDependency.dynamicId?.replace(node.dynamicId, "") ?? "";
            const localDynamicId = nestedDynamicId === "" ? `dependencies/${propertyName}` : nestedDynamicId;
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
    workingNode = mergeNode(workingNode, workingNode, "dependencies");
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
    let errors: ValidationResult[];
    if (node.dependentRequired) {
        errors = validateDependentRequired({ node, data, pointer, path }) ?? [];
    }
    if (node.dependentSchemas) {
        const schemaErrors = validateDependentSchemas({ node, data, pointer, path });
        if (schemaErrors) {
            errors = errors ?? [];
            errors.push(...schemaErrors);
        }
    }
    return errors;
}
