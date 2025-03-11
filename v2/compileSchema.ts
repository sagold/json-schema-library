import { isJsonError, JsonError, JsonSchema } from "../lib/types";
import { mergeSchema } from "../lib/mergeSchema";
import { omit } from "../lib/utils/omit";
import { SchemaNode, JsonSchemaReducerParams, ValidationPath } from "./types";
import { strict as assert } from "assert";
import * as draft2019 from "./draft2019";
import * as draft07 from "./draft07";
import sanitizeErrors from "./utils/sanitizeErrors";
import createSchemaOf from "../lib/createSchemaOf";
import { joinId } from "./utils/joinId";

const NODE_METHODS: Pick<
    SchemaNode,
    "get" | "getTemplate" | "reduce" | "resolveRef" | "toJSON" | "addRemote" | "compileSchema" | "validate" | "errors"
> = {
    errors: draft2019.ERRORS,

    compileSchema(schema: JsonSchema, spointer: string) {
        // assert(schema !== undefined, "schema missing");
        const parentNode = this as SchemaNode;
        const node: SchemaNode = {
            context: parentNode.context,
            parent: parentNode,
            spointer,
            reducers: [],
            resolvers: [],
            validators: [],
            getDefaultData: [],
            schema,
            ...NODE_METHODS
        };

        node.context.PARSER.forEach((parse) => parse(node)); // parser -> node-attributes, reducer & resolver
        node.context.VALIDATORS.forEach((registerValidator) => registerValidator(node));
        node.context.DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

        return node;
    },

    get(key: string | number, data?: unknown, path?: ValidationPath) {
        let node = this as SchemaNode;
        if (node.reducers.length) {
            const result = node.reduce({ data, path });
            if (isJsonError(result)) {
                return result;
            }
            node = result;
        }

        for (const resolver of node.resolvers) {
            const schemaNode = resolver({ data, key, node });
            if (schemaNode) {
                // console.log("get", key, resolver.name, schemaNode?.schema);
                return schemaNode;
            }
        }

        const referencedNode = node.resolveRef({ path });
        if (referencedNode !== node) {
            const ref = referencedNode.get(key, data, path);
            console.log("get ref", key, ref?.schema);
            return ref;
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

    reduce({ data, pointer, path }: JsonSchemaReducerParams) {
        // @path
        const resolvedNode = { ...this.resolveRef({ pointer, path }) } as SchemaNode;
        const resolvedSchema = mergeSchema(this.schema, resolvedNode?.schema);
        const node = (this as SchemaNode).compileSchema(resolvedSchema, this.spointer);

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
                node.errors.invalidDataError({
                    value: data,
                    pointer,
                    schema: node.schema
                })
            ];
        }

        for (const validate of node.validators) {
            const result = validate({ node, data, pointer: "#", path });
            if (Array.isArray(result)) {
                errors.push(...result);
            } else if (result) {
                errors.push(result);
            }
        }

        return sanitizeErrors(errors);
    },

    addRemote(url: string, schema: JsonSchema) {
        const { context } = this as SchemaNode;
        // @draft >= 6
        schema.$id = joinId(schema.$id || url);

        const node: SchemaNode = {
            spointer: "#",
            reducers: [],
            resolvers: [],
            validators: [],
            getDefaultData: [],
            schema,
            ...NODE_METHODS
        } as SchemaNode;

        let draft;
        const $schema = schema.$schema ?? this.context.rootNode.$schema;
        if ($schema?.includes("/draft-07/schema")) {
            draft = draft07;
            schema.$schema = "http://json-schema.org/draft-07/schema";
        } else if ($schema?.includes("/draft/2019-09/schema")) {
            draft = draft2019;
            schema.$schema = "https://json-schema.org/draft/2019-09/schema";
        } else {
            draft = draft2019;
            schema.$schema = "https://json-schema.org/draft/2019-09/schema";
        }

        node.context = {
            ...context,
            refs: {},
            rootNode: node,
            PARSER: draft.PARSER,
            VALIDATORS: draft.VALIDATORS,
            DEFAULT_DATA: draft.DEFAULT_DATA
        };
        node.context.remotes[url] = node;
        node.context.PARSER.forEach((parse) => parse(node)); // parser -> node-attributes, reducer & resolver
        node.context.VALIDATORS.forEach((registerValidator) => registerValidator(node));
        node.context.DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

        return this;
    },

    resolveRef() {
        throw new Error("required a customized resolveRef function on node");
    },

    toJSON() {
        return { ...this, context: undefined, errors: undefined, parent: this.parent?.spointer };
    }
};

/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(schema: JsonSchema) {
    assert(schema !== undefined, "schema missing");

    // # $vocabulary
    // - declares which JSON Schema features (vocabularies) are supported by this meta-schema
    // - each vocabulary is referenced by a URL, and its boolean value indicates whether it is required (true) or optional (false).

    // # allOf
    // - allOf actually includes the rules and constraints from the referenced schemas
    // - allOf pulls in the relevant meta-schema definitions to actually apply them

    // ✅ For validation purposes, you can ignore $vocabulary and rely on allOf to load the necessary meta-schemas.
    // ⚠️ However, if your validator is designed to support multiple versions or optimize processing, $vocabulary provides useful metadata.
    // - Determining Supported Features: Example: A validator could warn or error out if it encounters a vocabulary it does not support.
    // - Selective Parsing or Optimization: Example: If "unevaluatedProperties" is not in a supported vocabulary, your validator should not enforce it.
    // - Future-Proofing for Extensions: Future versions of JSON Schema may add optional vocabularies that aren't explicitly included in allOf.

    if (schema.$vocabulary) {
        console.log("handle vocabulary", schema.$vocabulary);
        // compile referenced meta schema
        // 1. could validate passed in schema
        // 2. could return a sanitized schema based on validation
        // then add parsers and validators based on meta-schema
    }

    const node: SchemaNode = {
        spointer: "#",
        reducers: [],
        resolvers: [],
        validators: [],
        getDefaultData: [],
        schema,
        ...NODE_METHODS
    } as SchemaNode;

    let draft;
    if (schema.$schema?.includes("/draft-07/schema")) {
        draft = draft07;
    } else if (schema.$schema?.includes("/draft/2019-09/schema")) {
        draft = draft2019;
    } else {
        draft = draft2019;
    }

    node.context = {
        remotes: {},
        anchors: {},
        refs: {},
        ids: {},
        rootNode: node,
        PARSER: draft.PARSER,
        VALIDATORS: draft.VALIDATORS,
        DEFAULT_DATA: draft.DEFAULT_DATA
    };
    node.context.remotes[schema.$id ?? "#"] = node;
    node.context.PARSER.forEach((parse) => parse(node)); // parser -> node-attributes, reducer & resolver
    node.context.VALIDATORS.forEach((registerValidator) => registerValidator(node));
    node.context.DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

    return node;
}
