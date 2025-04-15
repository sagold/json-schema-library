import { isSchemaNode } from "../types";
import { isObject } from "../utils/isObject";
import { mergeNode } from "../mergeNode";
import { hasProperty } from "../utils/hasProperty";
import { validateDependentRequired } from "./dependentRequired";
import { validateDependentSchemas } from "./dependentSchemas";
export const dependenciesKeyword = {
    id: "dependencies",
    keyword: "dependencies",
    parse: parseDependencies,
    order: -9,
    addReduce: (node) => node.schema.dependencies != null,
    reduce: reduceDependencies,
    addValidate: (node) => node.schema.dependencies != null,
    validate: validateDependencies
};
export function parseDependencies(node) {
    const { dependencies } = node.schema;
    if (!isObject(dependencies)) {
        return;
    }
    const schemas = Object.keys(dependencies);
    schemas.forEach((property) => {
        var _a, _b;
        const schema = dependencies[property];
        if (isObject(schema) || typeof schema === "boolean") {
            node.dependentSchemas = (_a = node.dependentSchemas) !== null && _a !== void 0 ? _a : {};
            node.dependentSchemas[property] = node.compileSchema(schema, `${node.evaluationPath}/dependencies/${property}`, `${node.schemaLocation}/dependencies/${property}`);
        }
        else {
            node.dependentRequired = (_b = node.dependentRequired) !== null && _b !== void 0 ? _b : {};
            node.dependentRequired[property] = schema;
        }
    });
}
export function reduceDependencies({ node, data, key, pointer, path }) {
    var _a;
    if (!isObject(data)) {
        // @todo remove dependentSchemas
        return node;
    }
    if (node.dependentRequired == null && node.dependentSchemas == null) {
        return node;
    }
    let workingNode = node.compileSchema(node.schema, node.evaluationPath, node.schemaLocation);
    let required = (_a = workingNode.schema.required) !== null && _a !== void 0 ? _a : [];
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
            var _a, _b;
            if (!hasProperty(data, propertyName) && !required.includes(propertyName)) {
                return true;
            }
            const dependency = node.dependentSchemas[propertyName];
            if (!isSchemaNode(dependency)) {
                return true;
            }
            // @note pass on updated required-list to resolve nested dependencies. This is currently supported,
            // but probably not how json-schema spec defines this behaviour (resolve only within sub-schema)
            const reducedDependency = { ...dependency, schema: { ...dependency.schema, required } }.reduceNode(data, {
                key,
                pointer: `${pointer}/dependencies/${propertyName}`,
                path
            }).node;
            workingNode = mergeNode(workingNode, reducedDependency);
            if (workingNode.schema.required) {
                required.push(...workingNode.schema.required);
            }
            // @dynamicId
            const nestedDynamicId = (_b = (_a = reducedDependency.dynamicId) === null || _a === void 0 ? void 0 : _a.replace(node.dynamicId, "")) !== null && _b !== void 0 ? _b : "";
            const localDynamicId = nestedDynamicId === "" ? `dependencies/${propertyName}` : nestedDynamicId;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;
        });
    }
    if (workingNode === node) {
        return node;
    }
    // mergedSchema = mergeSchema(node.schema, mergedSchema, "dependencies");
    // const { node: childNode, error } = node.compileSchema(mergedSchema, node.evaluationPath).reduceNode(data, { path });
    // return childNode ?? error;
    if (required.length === 0) {
        return workingNode;
    }
    required = workingNode.schema.required ? workingNode.schema.required.concat(...required) : required;
    required = required.filter((r, index, list) => list.indexOf(r) === index);
    workingNode = mergeNode(workingNode, workingNode, "dependencies");
    return workingNode.compileSchema({ ...workingNode.schema, required }, workingNode.evaluationPath, workingNode.schemaLocation, `${node.schemaLocation}(${dynamicId})`);
}
function validateDependencies({ node, data, pointer, path }) {
    var _a;
    if (!isObject(data)) {
        return undefined;
    }
    let errors;
    if (node.dependentRequired) {
        errors = (_a = validateDependentRequired({ node, data, pointer, path })) !== null && _a !== void 0 ? _a : [];
    }
    if (node.dependentSchemas) {
        const schemaErrors = validateDependentSchemas({ node, data, pointer, path });
        if (schemaErrors) {
            errors = errors !== null && errors !== void 0 ? errors : [];
            errors.push(...schemaErrors);
        }
    }
    return errors;
}
