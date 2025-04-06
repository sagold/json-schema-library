import sanitizeErrors from "./utils/sanitizeErrors";
import { CreateError } from "./errors/createCustomError";
import { draft04 } from "./draft04";
import { draft06 } from "./draft06";
import { draft07 } from "./draft07";
import { draft2019 } from "./draft2019";
import { draft2020 } from "./draft2020";
import { TemplateOptions } from "./methods/getTemplate";
import { getValue } from "./utils/getValue";
import { join, split } from "@sagold/json-pointer";
import { joinId } from "./utils/joinId";
import { mergeNode } from "./mergeNode";
import { omit } from "./utils/omit";
import { SchemaNode, isSchemaNode, isJsonError, JsonSchema, Draft, JsonError } from "./types";
import type { Keyword, JsonSchemaReducerParams } from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { hasProperty } from "./utils/hasProperty";
import { validateNode } from "./validateNode";
import { eachSchema } from "./methods/eachSchema";
import getRef from "./keywords/ref";

export type CompileOptions = {
    drafts: Draft[];
    remote: SchemaNode;
    formatAssertion: boolean | "meta-schema";
    errors: Record<string, CreateError>;
    templateDefaultOptions?: TemplateOptions;
};

const defaultDrafts: Draft[] = [draft04, draft06, draft07, draft2019, draft2020];

function getDraft(drafts: Draft[], $schema: string) {
    return drafts.find((d) => new RegExp(d.$schemaRegEx).test($schema)) ?? drafts[drafts.length - 1];
}

/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(schema: JsonSchema, options: Partial<CompileOptions> = {}) {
    /** @todo this option has to be passed to all drafts (remotes) */
    let formatAssertion = options.formatAssertion ?? true;
    const drafts = options.drafts ?? defaultDrafts;
    const draft = getDraft(drafts, schema?.$schema);

    const node: SchemaNode = {
        spointer: "#",
        lastIdPointer: "#",
        schemaId: "#",
        reducers: [],
        resolvers: [],
        validators: [],
        schema,
        errors: draft.errors,
        ...NODE_METHODS
    } as SchemaNode;

    node.context = {
        remotes: {},
        anchors: {},
        dynamicAnchors: {},
        ids: {},
        ...(options.remote?.context ?? {}),
        refs: {},
        rootNode: node,
        version: draft.version,
        keywords: draft.keywords,
        methods: draft.methods,
        templateDefaultOptions: options.templateDefaultOptions,
        drafts
    };

    if (options.remote) {
        const metaSchema = getRef(node, node.schema.$schema);
        if (isSchemaNode(metaSchema) && metaSchema.schema.$vocabulary) {
            const vocabs = Object.keys(metaSchema.schema.$vocabulary);
            // const withAnnotations = vocabs.find((vocab) => vocab.includes("vocab/format-annotation"));
            const formatAssertionString = vocabs.find((vocab) => vocab.includes("vocab/format-assertion"));
            if (formatAssertion === "meta-schema") {
                formatAssertion = metaSchema.schema.$vocabulary[formatAssertionString] === true;
            }
            const validKeywords = Object.keys(metaSchema.getTemplate({}, { addOptionalProps: true }));
            if (validKeywords.length > 0) {
                node.context.keywords = node.context.keywords.filter((f) => validKeywords.includes(f.keyword));
            }
        }
    }

    if (formatAssertion === false) {
        node.context.keywords = node.context.keywords.filter((f) => f.keyword !== "format");
    }

    node.context.remotes[schema?.$id ?? "#"] = node;
    addKeywords(node);
    return node;
}

const whitelist = ["$ref", "if", "$defs"];
const noRefMergeDrafts = ["draft-04", "draft-06", "draft-07"];
function addKeywords(node: SchemaNode) {
    if (node.schema.$ref && noRefMergeDrafts.includes(node.context.version)) {
        // for these draft versions only ref is validated
        node.context.keywords
            .filter(({ keyword }) => whitelist.includes(keyword))
            .forEach((keyword) => execKeyword(keyword, node));
        return;
    }
    const keys = Object.keys(node.schema);
    node.context.keywords
        .filter(({ keyword }) => keys.includes(keyword) || whitelist.includes(keyword))
        .forEach((keyword) => execKeyword(keyword, node));
}

function execKeyword(keyword: Keyword, node: SchemaNode) {
    // @todo consider first parsing all nodes
    keyword.parse?.(node);
    if (keyword.addReduce?.(node)) {
        node.reducers.push(keyword.reduce);
    }
    if (keyword.addResolve?.(node)) {
        node.resolvers.push(keyword.resolve);
    }
    if (keyword.addValidate?.(node)) {
        node.validators.push(keyword.validate);
    }
}

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

export function isReduceable(node: SchemaNode) {
    for (let i = 0, l = DYNAMIC_PROPERTIES.length; i < l; i += 1) {
        if (hasProperty(node, DYNAMIC_PROPERTIES[i])) {
            return true;
        }
    }
    return false;
}

const NODE_METHODS: Pick<
    SchemaNode,
    | "each"
    | "get"
    | "getRef"
    | "getSchema"
    | "getTemplate"
    | "getChildSchemaSelection"
    | "eachSchema"
    | "reduce"
    | "resolveRef"
    | "toJSON"
    | "addRemote"
    | "compileSchema"
    | "validate"
    | "validateAsync"
> = {
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
            errors: parentNode.errors,
            ...NODE_METHODS
        };

        addKeywords(node);

        return node;
    },

    each(data, callback, pointer) {
        const node = this as SchemaNode;
        return node.context.methods.each(node, data, callback, pointer);
    },

    eachSchema(callback) {
        const node = this as SchemaNode;
        return eachSchema(node, callback);
    },

    getChildSchemaSelection(property) {
        const node = this as SchemaNode;
        return node.context.methods.getChildSchemaSelection(node, property);
    },

    /**
     * Returns a node containing json-schema of a data-json-pointer.
     *
     * To resolve dynamic schema where the type of json-schema is evaluated by
     * its value, a data object has to be passed in options.
     *
     * Per default this function will return `undefined` schema for valid properties
     * that do not have a defined schema. Use the option `withSchemaWarning: true` to
     * receive an error with `code: schema-warning` containing the location of its
     * last evaluated json-schema.
     *
     * Example:
     *
     * ```ts
     * draft.setSchema({ type: "object", properties: { title: { type: "string" } } });
     * const result = draft.getSchema({  pointer: "#/title" }, data: { title: "my header" });
     * const schema = isSchemaNode(result) ? result.schema : undefined;
     * // schema = { type: "string" }
     * ```
     */
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

    getRef($ref: string) {
        return compileSchema({ $ref }, { remote: this }).resolveRef();
    },

    get(key, data, options = {}) {
        options.path = options.path ?? [];
        options.withSchemaWarning = options.withSchemaWarning ?? false;
        options.pointer = options.pointer ?? "#";
        const { path, pointer } = options;

        let node = this as SchemaNode;
        if (node.reducers.length) {
            const result = node.reduce(data, { key, path, pointer });
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

        if (options.createSchema === true) {
            return node.compileSchema(
                createSchema(getValue(data, key)),
                `${node.spointer}/additional`,
                `${node.schemaId}/additional`
            );
        }
    },

    getTemplate(data?, options?) {
        const node = this as SchemaNode;
        const opts = {
            recursionLimit: 1,
            ...node.context.templateDefaultOptions,
            cache: {},
            ...(options ?? {})
        };
        return node.context.methods.getTemplate(node, data, opts);
    },

    reduce(data, { pointer, key, path } = {}) {
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
            const nextNode = node.compileSchema(createSchema(data), node.spointer, node.schemaId);
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
            console.log("return boolean schema `false`");
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
        const errors = validateNode(this, data, pointer, path) ?? [];
        const flatErrorList = sanitizeErrors(Array.isArray(errors) ? errors : [errors]).filter(isJsonError);
        return {
            valid: flatErrorList.length === 0,
            errors: flatErrorList
        };
    },

    async validateAsync(data: unknown, pointer = "#", path = []) {
        const errors = validateNode(this, data, pointer, path) ?? [];
        let resolvedErrors = await Promise.all(sanitizeErrors(Array.isArray(errors) ? errors : [errors]));
        resolvedErrors = sanitizeErrors(resolvedErrors) as JsonError[];
        return {
            valid: resolvedErrors.length === 0,
            errors: resolvedErrors
        };
    },

    addRemote(url: string, schema: JsonSchema) {
        // @draft >= 6
        schema.$id = joinId(schema.$id || url);
        const { context } = this as SchemaNode;
        const draft = getDraft(context.drafts, schema?.$schema ?? this.context.rootNode.$schema);

        const node: SchemaNode = {
            spointer: "#",
            lastIdPointer: "#",
            schemaId: "#",
            reducers: [],
            resolvers: [],
            validators: [],
            schema,
            errors: draft.errors,
            ...NODE_METHODS
        } as SchemaNode;

        node.context = {
            ...context,
            refs: {},
            rootNode: node,
            methods: draft.methods,
            keywords: draft.keywords,
            version: draft.version
        };

        node.context.remotes[joinId(url)] = node;
        addKeywords(node);

        return this;
    },

    resolveRef() {
        throw new Error("required a customized resolveRef function on node");
    },

    toJSON() {
        return { ...this, context: undefined, errors: undefined, parent: this.parent?.spointer };
    }
};
