import { mergeSchema } from "../utils/mergeSchema";
import { isObject } from "../utils/isObject";
import { getValue } from "../utils/getValue";
import { validateNode } from "../validateNode";
export const patternPropertiesKeyword = {
    id: "patternProperties",
    keyword: "patternProperties",
    parse: parsePatternProperties,
    addReduce: (node) => node.patternProperties != null,
    reduce: reducePatternProperties,
    addResolve: (node) => node.patternProperties != null,
    resolve: patternPropertyResolver,
    addValidate: (node) => node.patternProperties != null,
    validate: validatePatternProperties
};
export function parsePatternProperties(node) {
    const { schema } = node;
    if (!isObject(schema.patternProperties)) {
        return;
    }
    const patterns = Object.keys(schema.patternProperties);
    if (patterns.length === 0) {
        return;
    }
    node.patternProperties = patterns.map((pattern) => ({
        name: pattern,
        pattern: new RegExp(pattern, "u"),
        node: node.compileSchema(schema.patternProperties[pattern], `${node.spointer}/patternProperties/${pattern}`, `${node.schemaId}/patternProperties/${pattern}`)
    }));
}
function patternPropertyResolver({ node, key }) {
    var _a, _b;
    return (_b = (_a = node.patternProperties) === null || _a === void 0 ? void 0 : _a.find(({ pattern }) => pattern.test(`${key}`))) === null || _b === void 0 ? void 0 : _b.node;
}
function reducePatternProperties({ node, data, key }) {
    var _a;
    const { patternProperties } = node;
    let mergedSchema;
    const dataProperties = Object.keys(data !== null && data !== void 0 ? data : {});
    if (key) {
        dataProperties.push(`${key}`);
    }
    let dynamicId = `${node.schemaId}(`;
    dataProperties.push(...Object.keys((_a = node.schema.properties) !== null && _a !== void 0 ? _a : {}));
    dataProperties.forEach((propertyName, index, list) => {
        var _a, _b;
        if (list.indexOf(propertyName) !== index) {
            // duplicate
            return;
        }
        // build schema of property
        let propertySchema = (_b = (_a = node.schema.properties) === null || _a === void 0 ? void 0 : _a[propertyName]) !== null && _b !== void 0 ? _b : {};
        const matchingPatterns = patternProperties.filter((property) => property.pattern.test(propertyName));
        matchingPatterns.forEach((pp) => (propertySchema = mergeSchema(propertySchema, pp.node.schema)));
        if (matchingPatterns.length > 0) {
            mergedSchema = mergedSchema !== null && mergedSchema !== void 0 ? mergedSchema : { properties: {} };
            mergedSchema.properties[propertyName] = propertySchema;
            dynamicId += `${matchingPatterns.map(({ name }) => `patternProperties/${name}`).join(",")}`;
        }
    });
    if (mergedSchema == null) {
        return node;
    }
    mergedSchema = mergeSchema(node.schema, mergedSchema, "patternProperties");
    return node.compileSchema(mergedSchema, node.spointer, node.schemaId, `${dynamicId})`);
}
function validatePatternProperties({ node, data, pointer, path }) {
    if (!isObject(data)) {
        return;
    }
    const { schema, patternProperties } = node;
    const properties = schema.properties || {};
    const patterns = Object.keys(schema.patternProperties).join(",");
    const errors = [];
    const keys = Object.keys(data);
    keys.forEach((key) => {
        const value = getValue(data, key);
        const matchingPatterns = patternProperties.filter((property) => property.pattern.test(key));
        matchingPatterns.forEach(({ node }) => errors.push(...validateNode(node, value, `${pointer}/${key}`, path)));
        if (properties[key]) {
            return;
        }
        if (matchingPatterns.length === 0 && schema.additionalProperties === false) {
            // this is an arrangement with additionalProperties
            errors.push(node.createError("no-additional-properties-error", {
                key,
                pointer: `${pointer}/${key}`,
                schema,
                value,
                patterns
            }));
        }
    });
    return errors;
}
