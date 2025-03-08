import { mergeSchema } from "../../lib/mergeSchema";
import { JsonError, JsonSchema } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import merge from "../../lib/utils/merge";
import {
    JsonSchemaReducerParams,
    JsonSchemaResolverParams,
    JsonSchemaValidatorParams,
    SchemaNode
} from "../compiler/types";
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
        let patternFound = false;
        let propertySchema = node.schema.properties?.[propertyName] ?? {};
        for (let i = 0, l = patternProperties.length; i < l; i += 1) {
            const { pattern } = patternProperties[i];
            if (pattern.test(propertyName)) {
                patternFound = true;
                propertySchema = mergeSchema(propertySchema, node.schema);
            }
        }
        if (patternFound) {
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
        const { draft, schema, patternProperties } = node;
        const properties = schema.properties || {};
        const pp = schema.patternProperties;

        const errors: JsonError[] = [];
        const keys = Object.keys(data);

        keys.forEach((key) => {
            let patternFound = false;
            const itemData = getValue(data, key);

            for (let i = 0, l = patternProperties.length; i < l; i += 1) {
                const { pattern, node: childNode } = patternProperties[i];

                if (pattern.test(key)) {
                    patternFound = true;
                    const valErrors = childNode.validate(itemData, `${pointer}/${key}`);
                    errors.push(...valErrors);
                }
            }

            if (properties[key]) {
                return;
            }

            if (patternFound === false && schema.additionalProperties === false) {
                // this is an arrangement with additionalProperties
                errors.push(
                    draft.errors.noAdditionalPropertiesError({
                        key,
                        pointer: `${pointer}/${key}`,
                        schema,
                        value: itemData,
                        patterns: Object.keys(pp).join(",")
                    })
                );
            }
        });

        return errors;
    });
}
