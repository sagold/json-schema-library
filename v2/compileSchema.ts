import * as draft04 from "./draft04";
import * as draft06 from "./draft06";
import * as draft07 from "./draft07";
import * as draft2019 from "./draft2019";
import createSchemaOf from "../lib/createSchemaOf";
import sanitizeErrors from "./utils/sanitizeErrors";
import { isJsonError, JsonError, JsonSchema } from "../lib/types";
import { joinId } from "./utils/joinId";
import { omit } from "../lib/utils/omit";
import { SchemaNode, JsonSchemaReducerParams, isSchemaNode, Context } from "./types";
import { strict as assert } from "assert";
import { getTemplate } from "./getTemplate";
import { join, split } from "@sagold/json-pointer";
import { mergeNode } from "./mergeNode";
import { getValue } from "./utils/getValue";

const DYNAMIC_PROPERTIES: string[] = [
    "$ref",
    "$defs",
    "if",
    "then",
    "else",
    "allOf",
    "anyOf",
    "oneOf",
    "dependentSchemas",
    "dependentRequired",
    "definitions",
    "dependencies",
    "patternProperties"
];

const NODE_METHODS: Pick<
    SchemaNode,
    | "get"
    | "getSchema"
    | "getTemplate"
    | "reduce"
    | "resolveRef"
    | "toJSON"
    | "addRemote"
    | "compileSchema"
    | "validate"
    | "errors"
> = {
    errors: draft2019.ERRORS,

    compileSchema(schema: JsonSchema, spointer: string = this.spointer, schemaId?: string) {
        const nextFragment = spointer.split("/$ref")[0];
        const parentNode = this as SchemaNode;
        const node: SchemaNode = {
            lastIdPointer: parentNode.lastIdPointer, // ref helper
            context: parentNode.context,
            parent: parentNode,
            spointer,
            schemaId: schemaId ?? join(parentNode.schemaId, nextFragment),
            reducers: [],
            resolvers: [],
            validators: [],
            schema,
            ...NODE_METHODS
        };

        addFeatures(node);

        return node;
    },

    getSchema(pointer, data, options = {}) {
        options.path = options.path ?? [];
        options.withSchemaWarning = options.withSchemaWarning ?? false;
        options.pointer = options.pointer ?? "#";

        const keys = split(pointer);
        if (keys.length === 0) {
            return this.resolveRef(options);
        }
        let currentPointer = "#";
        let node = this as SchemaNode;
        for (let i = 0, l = keys.length; i < l; i += 1) {
            currentPointer = `${currentPointer}/${keys[i]}`;
            const nextNode = node.get(keys[i], data, { ...options, pointer: currentPointer });
            if (!isSchemaNode(nextNode)) {
                return nextNode;
            }
            data = getValue(data, keys[i]);
            node = nextNode;
        }
        return node.resolveRef(options);
    },

    get(key, data, options = {}) {
        options.path = options.path ?? [];
        options.withSchemaWarning = options.withSchemaWarning ?? false;
        options.pointer = options.pointer ?? "#";
        const { path, pointer } = options;

        let node = this as SchemaNode;
        if (node.reducers.length) {
            const result = node.reduce({ data, key, path, pointer });
            if (isJsonError(result)) {
                return result;
            }
            if (isSchemaNode(result)) {
                node = result;
            }
        }

        for (const resolver of node.resolvers) {
            const schemaNode = resolver({ data, key, node });
            if (schemaNode) {
                return schemaNode;
            }
        }

        const referencedNode = node.resolveRef({ path });
        if (referencedNode !== node) {
            return referencedNode.get(key, data, options);
        }

        if (options.withSchemaWarning === true) {
            return node.errors.schemaWarning({ pointer, value: data, schema: node.schema, key });
        }
    },

    getTemplate(data?, options?) {
        const { cache, recursionLimit } = options ?? {};
        const opts = { ...(options ?? {}), cache: cache ?? {}, recursionLimit: recursionLimit ?? 1 };
        const node = this as SchemaNode;
        return getTemplate(node, data, opts);
    },

    reduce({ data, pointer, key, path }: JsonSchemaReducerParams) {
        const resolvedNode = { ...this.resolveRef({ pointer, path }) } as SchemaNode;
        // const resolvedSchema = mergeSchema(this.schema, resolvedNode?.schema);
        // const node = (this as SchemaNode).compileSchema(resolvedSchema, this.spointer, resolvedSchema.schemaId);
        const node = mergeNode(this, resolvedNode, "$ref");
        // const node = resolvedNode;

        // @ts-expect-error bool schema
        if (node.schema === false) {
            return node;
            // @ts-expect-error bool schema
        } else if (node.schema === true) {
            const nextNode = node.compileSchema(createSchemaOf(data), node.spointer, node.schemaId);
            path?.push({ pointer, node });
            return nextNode;
        }

        let schema;
        let workingNode = node;
        const reducers = node.reducers;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, key, node, pointer });
            if (isJsonError(result)) {
                return result;
            }
            if (result) {
                // @ts-expect-error bool schema - for undefined & false schema return false schema
                if (result.schema === false) {
                    schema = false;
                    break;
                }

                // compilation result for data of current schemain order to merge results, we rebuild
                // node from schema alternatively we would need to merge by node-property
                workingNode = mergeNode(workingNode, result);
            }
        }

        if (schema === false) {
            console.log("BOOLEAN SCHEMA RETURN");
            // @ts-expect-error bool schema
            return { ...node, schema: false, reducers: [] } as SchemaNode;
        }

        if (workingNode !== node) {
            path?.push({ pointer, node });
        }

        // remove dynamic properties of node
        workingNode.schema = omit(workingNode.schema, ...DYNAMIC_PROPERTIES);
        // @ts-expect-error string accessing schema props
        DYNAMIC_PROPERTIES.forEach((prop) => (workingNode[prop] = undefined));
        return workingNode;
    },

    validate(data: unknown, pointer = "#", path = []) {
        // before running validation, we need to resolve ref and recompile for any
        // newly resolved schema properties - but this should be done for refs, etc only
        const node = this as SchemaNode;
        path.push({ pointer, node });

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
            // console.log("validator", validate.name);
            const result = validate({ node, data, pointer, path });
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
            lastIdPointer: "#",
            schemaId: "#",
            reducers: [],
            resolvers: [],
            validators: [],
            schema,
            ...NODE_METHODS
        } as SchemaNode;

        let draft;
        const $schema = schema.$schema ?? this.context.rootNode.$schema;
        if ($schema?.includes("draft-04")) {
            draft = draft04;
            schema.$schema = "http://json-schema.org/draft-04/schema";
        } else if ($schema?.includes("draft-06")) {
            draft = draft06;
            schema.$schema = "http://json-schema.org/draft-06/schema";
        } else if ($schema?.includes("draft-07")) {
            draft = draft07;
            schema.$schema = "http://json-schema.org/draft-07/schema";
        } else if ($schema?.includes("2019-09")) {
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
            FEATURES: draft.FEATURES,
            VERSION: draft.VERSION
        };

        node.context.remotes[joinId(url)] = node;
        addFeatures(node);

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
export function compileSchema(schema: JsonSchema, remoteContext?: Context) {
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
        lastIdPointer: "#",
        schemaId: "#",
        reducers: [],
        resolvers: [],
        validators: [],
        schema,
        ...NODE_METHODS
    } as SchemaNode;

    let draft;
    if (schema.$schema?.includes("draft-04")) {
        draft = draft04;
    } else if (schema.$schema?.includes("draft-06")) {
        draft = draft06;
    } else if (schema.$schema?.includes("draft-07")) {
        draft = draft07;
    } else if (schema.$schema?.includes("2019-09")) {
        draft = draft2019;
    } else {
        draft = draft2019;
    }

    node.context = {
        remotes: {},
        anchors: {},
        ids: {},
        ...(remoteContext ?? {}),
        refs: {},
        rootNode: node,
        VERSION: draft.VERSION,
        FEATURES: draft.FEATURES
    };

    node.context.remotes[schema.$id ?? "#"] = node;
    addFeatures(node);

    return node;
}

// - $ref parses node id and has to execute everytime
// - if is a shortcut for if-then-else and should always parse
const whitelist = ["$ref", "if"];
function addFeatures(node: SchemaNode) {
    const keys = Object.keys(node.schema);
    node.context.FEATURES.filter(({ keyword }) => keys.includes(keyword) || whitelist.includes(keyword)).forEach(
        (feature) => {
            feature.parse?.(node);
            if (feature.addReduce?.(node)) {
                node.reducers.push(feature.reduce);
            }
            if (feature.addResolve?.(node)) {
                node.resolvers.push(feature.resolve);
            }
            if (feature.addValidate?.(node)) {
                node.validators.push(feature.validate);
            }
        }
    );
}
