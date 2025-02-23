import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import { getValue } from "../getValue";

patternPropertyResolver.toJSON = () => "patternPropertyResolver";
function patternPropertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.patternProperties.find(({ pattern }) => pattern.test(`${key}`))?.node;
}

export function parsePatternProperties(node: SchemaNode) {
    const { draft, schema } = node;
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
            node: node.compileSchema(
                draft,
                schema.patternProperties[pattern],
                `${node.spointer}/patternProperties/${pattern}`,
                node
            )
        })
    );
    node.resolvers.push(patternPropertyResolver);
}

export function patternPropertiesValidator({ schema, validators }: SchemaNode) {
    if (!isObject(schema.patternProperties)) {
        return;
    }

    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (!isObject(data)) {
            return;
        }
        const { draft, schema } = node;
        const properties = schema.properties || {};
        const pp = schema.patternProperties;

        const errors: JsonError[] = [];
        const keys = Object.keys(data);

        keys.forEach((key) => {
            let patternFound = false;
            const itemData = getValue(data, key);

            for (let i = 0, l = node.patternProperties.length; i < l; i += 1) {
                const { pattern, node: childNode } = node.patternProperties[i];

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
