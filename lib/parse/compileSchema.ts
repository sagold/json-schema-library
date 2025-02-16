import { strict as assert } from "assert";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { JsonSchema } from "../types";
import { SchemaNode, JsonSchemaReducerParams } from "./compiler/types";
import { reduceAllOf, reduceIf } from "./compiler/reducer";
import { propertyResolver, additionalPropertyResolver } from "./compiler/resolver";
import { isObject } from "../utils/isObject";

function compile(data: unknown) {
    // @todo this recreates the node with given data, but also disregards all
    // current evaluations for properties and additionalProperties..
    const node = (this as SchemaNode).reduce({ data });

    // compile static schema
    const { schema, draft } = node;
    if (schema.properties) {
        node.children = Object.keys(schema.properties).map((propertyName) => {
            const node = compileSchema(draft, schema.properties[propertyName]);
            node.key = propertyName;
            return node;
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
        children: [],
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

    if (Array.isArray(schema.allOf)) {
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

    let schema = { ...node.schema };
    for (let i = 0; i < reducers.length; i += 1) {
        const result = reducers[i]({ data, node: this });
        if (result) {
            schema = mergeSchema(schema, result.schema);
        }
    }

    return compileSchema(this.draft, schema);
}

function toJSON() {
    return {
        ...this,
        draft: undefined
    };
}
