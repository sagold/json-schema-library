import { strict as assert } from "assert";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { JsonSchema } from "../types";
import { SchemaNode, JsonSchemaReducerParams } from "./compiler/types";
import { reduceAllOf, reduceIf } from "./compiler/reducer";
import { propertyResolver, additionalPropertyResolver, getValue } from "./compiler/resolver";
import { isObject } from "../utils/isObject";
import { omit } from "../utils/omit";

function compile(data?: unknown) {
    // @todo this recreates the node with given data, but also disregards all
    // current evaluations for properties and additionalProperties..
    const node = (this as SchemaNode).reduce({ data });

    // compile static schema
    const { draft } = node;
    // cleanup schema in case reducer skipped creating new schema
    const schema = omit(node.schema, "if", "then", "else", "allOf") as JsonSchema;

    if (schema.properties) {
        node.properties = {};
        Object.keys(schema.properties).forEach((propertyName) => {
            const propertyNode = compileSchema(draft, schema.properties[propertyName]);
            propertyNode.key = propertyName;
            node.properties[propertyName] = propertyNode;
        });
        node.resolvers.push(propertyResolver);
    }

    // compile pattern schema
    if (schema.additionalProperties !== false) {
        if (isObject(schema.additionalProperties)) {
            node.additionalProperties = compileSchema(draft, schema.additionalProperties);
        }
        node.resolvers.push(additionalPropertyResolver);
    }

    return {
        // data,
        // schemaNode: this,
        getSchema() {
            return schema;
        },

        next(key: string | number) {
            for (const resolver of node.resolvers) {
                const schemaNode = resolver({ data, key, node });
                if (schemaNode) {
                    return schemaNode.compile(getValue(data, key));
                }
            }
        },

        get(key: string | number) {
            for (const resolver of node.resolvers) {
                const schemaNode = resolver({ data, key, node });
                if (schemaNode) {
                    return schemaNode?.schema;
                }
            }
        }
    };
}

/**
 * @todo How can we do more work upfront?
 *
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(draft: Draft, schema: JsonSchema) {
    assert(schema !== undefined, "schema missing");
    const node: SchemaNode = {
        // config
        draft,
        reducers: [],
        resolvers: [],
        schema,
        // methods
        compile,
        compileSchema,
        reduce,
        toJSON
    };

    // compile dynamic schema and add reducer
    if (schema.if && (schema.then || schema.else)) {
        node.if = compileSchema(draft, schema.if);
        node.then = schema.then ? compileSchema(draft, schema.then) : undefined;
        node.else = schema.else ? compileSchema(draft, schema.else) : undefined;
        node.reducers.push(reduceIf);
    }

    if (Array.isArray(schema.allOf) && schema.allOf.length) {
        node.allOf = schema.allOf.map((s) => compileSchema(draft, s));
        node.reducers.push(reduceAllOf);
    }

    return node;
}

/*
    node
        - schema
        - resolver
    > resolver
        > schemaNode (containing partial schema)
    > merge all schema with source schema
    > compile schema (again) with partialy schema
*/
function reduce({ data }: JsonSchemaReducerParams) {
    const node = this as SchemaNode;
    const reducers = node.reducers;

    let schema;
    for (let i = 0; i < reducers.length; i += 1) {
        const result = reducers[i]({ data, node: this });
        if (result) {
            // compilation result for data of current schema
            // in order to merge results, we rebuild node from schema
            // alternatively we would need to merge by node-property
            schema = mergeSchema(schema ?? {}, result.schema);
        }
    }

    if (schema) {
        // recompile to update newly added schema defintions
        schema = mergeSchema(node.schema, schema);
        return compileSchema(this.draft, schema);
    }

    return node;
}

function toJSON() {
    return {
        ...this,
        draft: undefined
    };
}
