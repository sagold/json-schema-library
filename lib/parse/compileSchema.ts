import { strict as assert } from "assert";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { JsonSchema } from "../types";
import { SchemaNode, JsonSchemaReducerParams } from "./compiler/types";
import { reduceAllOf, reduceIf } from "./compiler/reducer";
import { propertyResolver, additionalPropertyResolver } from "./compiler/resolver";
import { isObject } from "../utils/isObject";
import { omit } from "../utils/omit";

const NODE_METHODS: Pick<SchemaNode, "get" | "reduce" | "toJSON" | "compileSchema"> = {
    compileSchema,

    get(key: string | number, data?: unknown) {
        // console.log(`-- get ${key} --`);
        let node = this as SchemaNode;
        if (node.reducers.length) {
            node = node.reduce({ data });
        }

        for (const resolver of node.resolvers) {
            const schemaNode = resolver({ data, key, node });
            if (schemaNode) {
                return schemaNode;
            }
        }
    },

    /*
        node
            - schema
            - resolver
        > resolver
            > schemaNode (containing partial schema)
        > merge all schema with source schema
        > compile schema (again) with partialy schema
    */
    reduce({ data }: JsonSchemaReducerParams) {
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
            schema = mergeSchema(node.schema, schema, "if", "then", "else", "allOf");
            // console.log("reduced schema", schema);
            return compileSchema(this.draft, schema, this.spointer);
        }

        // remove dynamic properties of node
        return { ...node, schema: omit(node.schema, "if", "then", "else", "allOf"), reducers: [] };
    },

    toJSON() {
        return {
            ...this,
            draft: undefined
        };
    }
};

/**
 * @todo How can we do more work upfront?
 *
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(draft: Draft, schema: JsonSchema, spointer = "#") {
    // console.log("compile schema", spointer);
    assert(schema !== undefined, "schema missing");
    const node: SchemaNode = {
        // state
        spointer,
        draft,
        reducers: [],
        resolvers: [],
        schema,
        ...NODE_METHODS
    };

    // compile dynamic schema and add reducer
    if (schema.if && (schema.then || schema.else)) {
        node.if = compileSchema(draft, schema.if, `${spointer}/if`);
        node.then = schema.then ? compileSchema(draft, schema.then, `${spointer}/then`) : undefined;
        node.else = schema.else ? compileSchema(draft, schema.else, `${spointer}/else`) : undefined;
        node.reducers.push(reduceIf);
    }

    if (Array.isArray(schema.allOf) && schema.allOf.length) {
        // @todo immediately compile if no resolvers are added
        node.allOf = schema.allOf.map((s, index) => compileSchema(draft, s, `${spointer}/allOf/${index}`));
        node.reducers.push(reduceAllOf);
    }

    if (schema.properties) {
        node.properties = {};
        Object.keys(schema.properties).forEach((propertyName) => {
            const propertyNode = compileSchema(
                draft,
                schema.properties[propertyName],
                `${spointer}/properties/${propertyName}`
            );
            node.properties[propertyName] = propertyNode;
        });
        node.resolvers.push(propertyResolver);
    }

    // compile pattern schema
    if (schema.additionalProperties !== false) {
        if (isObject(schema.additionalProperties)) {
            node.additionalProperties = compileSchema(
                draft,
                schema.additionalProperties,
                `${spointer}/additionalProperties`
            );
        }
        node.resolvers.push(additionalPropertyResolver);
    }

    return node;
}
