import { Draft } from "../lib/draft";
import { isJsonError, JsonError, JsonSchema } from "../lib/types";
import { mergeSchema } from "../lib/mergeSchema";
import { omit } from "../lib/utils/omit";
import { SchemaNode, JsonSchemaReducerParams } from "./compiler/types";
import { strict as assert } from "assert";

import { DEFAULT_DATA } from "./compiler/defaultData";
import { PARSER } from "./compiler/parser";
import { VALIDATORS } from "./compiler/validators";
import sanitizeErrors from "./utils/sanitizeErrors";
import createSchemaOf from "../lib/createSchemaOf";

const NODE_METHODS: Pick<
    SchemaNode,
    "get" | "getTemplate" | "reduce" | "resolveRef" | "toJSON" | "addRemote" | "compileSchema" | "validate"
> = {
    compileSchema,

    get(key: string | number, data?: unknown) {
        let node = this as SchemaNode;
        if (node.reducers.length) {
            const result = node.reduce({ data });
            if (isJsonError(result)) {
                return result;
            }
            node = result;
        }

        for (const resolver of node.resolvers) {
            const schemaNode = resolver({ data, key, node });
            if (schemaNode) {
                return schemaNode;
            }
        }
    },

    getTemplate(data?: unknown) {
        const node = this as SchemaNode;
        let defaultData = data;
        for (const getDefaultData of node.getDefaultData) {
            defaultData = getDefaultData({ data: defaultData, node }) ?? defaultData;
        }
        return defaultData;
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
    reduce({ data, pointer }: JsonSchemaReducerParams) {
        // @path
        const node = { ...this.resolveRef() } as SchemaNode;
        const reducers = node.reducers;

        // @ts-expect-error bool schema
        if (node.schema === false) {
            return node;
            // @ts-expect-error bool schema
        } else if (node.schema === true) {
            return node.compileSchema(node.draft, createSchemaOf(data), node.spointer, node);
        }

        let schema;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, node, pointer });
            if (isJsonError(result)) {
                return result;
            }
            if (result) {
                // compilation result for data of current schema
                // in order to merge results, we rebuild node from schema
                // alternatively we would need to merge by node-property
                schema = mergeSchema(schema ?? {}, result.schema);
            }
        }

        if (schema) {
            // recompile to update newly added schema defintions
            schema = mergeSchema(node.schema, schema, "if", "then", "else", "allOf", "anyOf", "oneOf");
            // console.log("reduced schema", schema);
            return node.compileSchema(this.draft, schema, this.spointer, node);
        }

        // remove dynamic properties of node
        return { ...node, schema: omit(node.schema, "if", "then", "else", "allOf", "anyOf", "oneOf"), reducers: [] };
    },

    validate(data: unknown, pointer = "#") {
        // before running validation, we need to resolve ref and recompile for any
        // newly resolved schema properties - but this should be done for refs, etc only
        const node = { ...this.resolveRef() } as SchemaNode;
        const errors: JsonError[] = [];
        // @ts-expect-error untyped boolean schema
        if (node.schema === true) {
            return errors;
        }
        // @ts-expect-error untyped boolean schema
        if (node.schema === false) {
            return [
                node.draft.errors.invalidDataError({
                    value: data,
                    pointer,
                    schema: node.schema
                })
            ];
        }

        for (const validate of node.validators) {
            const result = validate({ node, data, pointer: "#" });
            if (Array.isArray(result)) {
                errors.push(...result);
            } else if (result) {
                errors.push(result);
            }
        }

        return sanitizeErrors(errors);
    },

    addRemote(url: string, schema: JsonSchema) {
        const node = this as SchemaNode;
        // @draft >= 6
        schema.$id = schema.$id || url;
        node.context.remotes[url] = node.compileSchema(node.draft, schema);
        return this;
    },

    resolveRef() {
        throw new Error("required a customized resolveRef function on node");
    },

    toJSON() {
        return { ...this, draft: undefined, context: undefined, parent: this.parent?.spointer };
    }
};

function createNode(draft: Draft, schema: JsonSchema, spointer = "#", parentNode?: SchemaNode): SchemaNode {
    return {
        parent: parentNode,
        context: parentNode?.context ?? { ids: {}, remotes: {}, anchors: {}, scopes: {}, rootSchema: schema },
        spointer,
        draft,
        reducers: [],
        resolvers: [],
        validators: [],
        getDefaultData: [],
        schema,
        ...NODE_METHODS
    };
}

/**
 * @todo How can we do more work upfront?
 *
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(draft: Draft, schema: JsonSchema, spointer = "#", parentNode?: SchemaNode) {
    // console.log("compile schema", spointer);
    assert(schema !== undefined, "schema missing");
    const node: SchemaNode = createNode(draft, schema, spointer, parentNode);

    // @note - if we parse a dynamic schema, we skip certain properties that are note yet available
    // e.g. { $ref: "#" } -> { additionalProperties: false }
    // node.schema = node.resolveRef();

    PARSER.forEach((parse) => parse(node)); // parser -> node-attributes, reducer & resolver
    VALIDATORS.forEach((registerValidator) => registerValidator(node));
    DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

    return node;
}
