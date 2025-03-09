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
    compileSchema(schema: JsonSchema, spointer: string) {
        // assert(schema !== undefined, "schema missing");
        const parentNode = this as SchemaNode;
        const node: SchemaNode = {
            context: parentNode.context,
            parent: parentNode,
            spointer,
            draft: parentNode.draft,
            reducers: [],
            resolvers: [],
            validators: [],
            getDefaultData: [],
            schema,
            ...NODE_METHODS
        };

        // @note - if we parse a dynamic schema, we skip certain properties that are note yet available
        // e.g. { $ref: "#" } -> { additionalProperties: false }
        // node.schema = node.resolveRef();

        PARSER.forEach((parse) => parse(node)); // parser -> node-attributes, reducer & resolver
        VALIDATORS.forEach((registerValidator) => registerValidator(node));
        DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

        return node;
    },

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
    reduce({ data, pointer, path }: JsonSchemaReducerParams) {
        // @path
        const node = { ...this.resolveRef({ pointer, path }) } as SchemaNode;
        const reducers = node.reducers;

        // @ts-expect-error bool schema
        if (node.schema === false) {
            return node;

            // @ts-expect-error bool schema
        } else if (node.schema === true) {
            const nextNode = node.compileSchema(createSchemaOf(data), node.spointer);
            path?.push({ pointer, node });
            return nextNode;
        }

        let schema;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, node, pointer });
            if (isJsonError(result)) {
                return result;
            }
            if (result) {
                // @ts-expect-error bool schema - for undefined & false schema return false schema
                if ((schema || result.schema) === false) {
                    schema = false;
                } else {
                    // compilation result for data of current schemain order to merge results, we rebuild
                    // node from schema alternatively we would need to merge by node-property
                    // @ts-expect-error bool schema
                    schema = mergeSchema(schema ?? {}, result.schema);
                }
            }
        }

        if (schema === false) {
            // @ts-expect-error bool schema
            return { ...node, schema: false, reducers: [] } as SchemaNode;
        }

        if (schema) {
            // recompile to update newly added schema defintions
            // @ts-expect-error bool schema
            schema = mergeSchema(node.schema, schema, "if", "then", "else", "allOf", "anyOf", "oneOf");
            const nextNode = node.compileSchema(schema, this.spointer);
            path?.push({ pointer, node });
            return nextNode;
        }

        // remove dynamic properties of node
        return { ...node, schema: omit(node.schema, "if", "then", "else", "allOf", "anyOf", "oneOf"), reducers: [] };
    },

    validate(data: unknown, pointer = "#", path = []) {
        // before running validation, we need to resolve ref and recompile for any
        // newly resolved schema properties - but this should be done for refs, etc only
        path.push({
            pointer,
            node: this as SchemaNode
        });

        const node = this as SchemaNode;

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

        // console.log(pointer, "validate", data, "by", node.spointer, ":", node.schema, "ref:", node.ref);

        for (const validate of node.validators) {
            const result = validate({ node, data, pointer: "#", path });
            if (Array.isArray(result)) {
                errors.push(...result);
            } else if (result) {
                errors.push(result);
            }
        }

        // console.log("ERRORS", errors);
        return sanitizeErrors(errors);
    },

    addRemote(url: string, schema: JsonSchema) {
        const { context, draft } = this as SchemaNode;
        // @draft >= 6
        schema.$id = schema.$id || url;

        const node: SchemaNode = {
            spointer: "#",
            draft,
            reducers: [],
            resolvers: [],
            validators: [],
            getDefaultData: [],
            schema,
            ...NODE_METHODS
        } as SchemaNode;

        node.context = { ...context, refs: {}, rootNode: node };
        node.context.remotes[url] = node;

        // @note - if we parse a dynamic schema, we skip certain properties that are note yet available
        // e.g. { $ref: "#" } -> { additionalProperties: false }
        // node.schema = node.resolveRef();
        PARSER.forEach((parse) => parse(node)); // parser -> node-attributes, reducer & resolver
        VALIDATORS.forEach((registerValidator) => registerValidator(node));
        DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

        return this;
    },

    resolveRef() {
        throw new Error("required a customized resolveRef function on node");
    },

    toJSON() {
        return { ...this, draft: undefined, context: undefined, parent: this.parent?.spointer };
    }
};

/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(draft: Draft, schema: JsonSchema) {
    assert(schema !== undefined, "schema missing");

    const node: SchemaNode = {
        spointer: "#",
        draft,
        reducers: [],
        resolvers: [],
        validators: [],
        getDefaultData: [],
        schema,
        ...NODE_METHODS
    } as SchemaNode;

    node.context = {
        remotes: {},
        anchors: {},
        refs: {},
        ids: {},
        rootNode: node
    };

    // @note - if we parse a dynamic schema, we skip certain properties that are note yet available
    // e.g. { $ref: "#" } -> { additionalProperties: false }
    // node.schema = node.resolveRef();
    PARSER.forEach((parse) => parse(node)); // parser -> node-attributes, reducer & resolver
    VALIDATORS.forEach((registerValidator) => registerValidator(node));
    DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

    return node;
}
