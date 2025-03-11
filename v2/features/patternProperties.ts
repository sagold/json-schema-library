import { mergeSchema } from "../../lib/mergeSchema";
import { JsonError, JsonSchema } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaReducerParams, JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../types";
import { getValue } from "../utils/getValue";

patternPropertyResolver.toJSON = () => "patternPropertyResolver";
function patternPropertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.patternProperties.find(({ pattern }) => pattern.test(`${key}`))?.node;
}

export function parsePatternProperties(node: SchemaNode) {
    const { schema } = node;
    if (!isObject(schema.patternProperties)) {
        return;
    }
    const patterns = Object.keys(schema.patternProperties);
    if (patterns.length === 0) {
        return;
    }
    node.patternProperties = [];
    patterns.map((pattern) =>
        node.patternProperties.push({
            pattern: new RegExp(pattern),
            node: node.compileSchema(schema.patternProperties[pattern], `${node.spointer}/patternProperties/${pattern}`)
        })
    );
    node.resolvers.push(patternPropertyResolver);
    node.reducers.push(reducePatternProperties);
}

reducePatternProperties.toJSON = () => "reducePatternProperties";
function reducePatternProperties({ node, data }: JsonSchemaReducerParams) {
    if (!isObject(data)) {
        return;
    }
    const { patternProperties } = node;
    let mergedSchema: JsonSchema;
    Object.keys(data).forEach((propertyName) => {
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

export function patternPropertiesValidator({ schema, validators }: SchemaNode) {
    if (!isObject(schema.patternProperties)) {
        return;
    }

    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
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
    });
}
