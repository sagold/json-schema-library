import { mergeSchema } from "../utils/mergeSchema";
import { JsonError, JsonSchema } from "../types";
import { isObject } from "../utils/isObject";
import {
    Feature,
    JsonSchemaReducerParams,
    JsonSchemaResolverParams,
    JsonSchemaValidatorParams,
    SchemaNode
} from "../types";
import { getValue } from "../utils/getValue";

export const patternPropertiesFeature: Feature = {
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

export function parsePatternProperties(node: SchemaNode) {
    const { schema } = node;
    if (!isObject(schema.patternProperties)) {
        return;
    }
    const patterns = Object.keys(schema.patternProperties);
    if (patterns.length === 0) {
        return;
    }
    node.patternProperties = patterns.map((pattern) => ({
        pattern: new RegExp(pattern),
        node: node.compileSchema(
            schema.patternProperties[pattern],
            `${node.spointer}/patternProperties/${pattern}`,
            `${node.schemaId}/patternProperties/${pattern}`
        )
    }));
}

function patternPropertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.patternProperties?.find(({ pattern }) => {
        return pattern.test(`${key}`);
    })?.node;
}

function reducePatternProperties({ node, data, key }: JsonSchemaReducerParams) {
    if (!isObject(data) && data != null && key === undefined) {
        return;
    }
    const { patternProperties } = node;
    let mergedSchema: JsonSchema;

    const dataProperties = Object.keys(data ?? {});
    if (key) {
        dataProperties.push(`${key}`);
    }
    dataProperties.push(...Object.keys(node.schema.properties ?? {}));
    dataProperties.forEach((propertyName, index, list) => {
        if (list.indexOf(propertyName) !== index) {
            // duplicate
            return;
        }
        // build schema of property
        let propertySchema = node.schema.properties?.[propertyName] ?? {};
        const matchingPatterns = patternProperties.filter((property) => property.pattern.test(propertyName));
        matchingPatterns.forEach((pp) => (propertySchema = mergeSchema(propertySchema, pp.node.schema)));
        if (matchingPatterns.length > 0) {
            mergedSchema = mergedSchema ?? { properties: {} };
            mergedSchema.properties[propertyName] = propertySchema;
        }
    });

    if (mergedSchema == null) {
        return node;
    }

    mergedSchema = mergeSchema(node.schema, mergedSchema, "patternProperties");
    return node.compileSchema(mergedSchema, node.spointer);
}

function validatePatternProperties({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return;
    }
    const { schema, patternProperties } = node;
    const properties = schema.properties || {};
    const patterns = Object.keys(schema.patternProperties).join(",");
    const errors: JsonError[] = [];
    const keys = Object.keys(data);

    keys.forEach((key) => {
        const value = getValue(data, key);
        const matchingPatterns = patternProperties.filter((property) => property.pattern.test(key));
        matchingPatterns.forEach(({ node }) => errors.push(...node.validate(value, `${pointer}/${key}`)));

        if (properties[key]) {
            return;
        }

        if (matchingPatterns.length === 0 && schema.additionalProperties === false) {
            // this is an arrangement with additionalProperties
            errors.push(
                node.errors.noAdditionalPropertiesError({
                    key,
                    pointer: `${pointer}/${key}`,
                    schema,
                    value,
                    patterns
                })
            );
        }
    });

    return errors;
}
