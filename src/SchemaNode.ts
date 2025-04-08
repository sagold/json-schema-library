import copy from "fast-copy";
import sanitizeErrors from "./utils/sanitizeErrors";
import settings from "./settings";
import type { JsonSchemaReducer, JsonSchemaResolver, JsonSchemaValidator, Keyword, ValidationPath } from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { dashCase } from "./utils/dashCase";
import { Draft } from "./Draft";
import { eachSchema, EachSchemaCallback } from "./methods/eachSchema";
import { getValue } from "./utils/getValue";
import { isJsonError, JsonSchema, JsonError, ErrorData, DefaultErrors, OptionalNodeAndError } from "./types";
import { isObject } from "./utils/isObject";
import { join, split } from "@sagold/json-pointer";
import { joinId } from "./utils/joinId";
import { mergeNode } from "./mergeNode";
import { omit } from "./utils/omit";
import { pick } from "./utils/pick";
import { render } from "./errors/render";
import { TemplateOptions } from "./methods/getTemplate";
import { validateNode } from "./validateNode";

const { DYNAMIC_PROPERTIES } = settings;

export function isSchemaNode(value: unknown): value is SchemaNode {
    return isObject(value) && Array.isArray(value?.reducers) && Array.isArray(value?.resolvers);
}

export function isReduceable(node: SchemaNode) {
    for (let i = 0, l = DYNAMIC_PROPERTIES.length; i < l; i += 1) {
        // @ts-expect-error interface to object conversion
        if (hasProperty(node, DYNAMIC_PROPERTIES[i])) {
            return true;
        }
    }
    return false;
}

function getDraft(drafts: Draft[], $schema: string) {
    return drafts.find((d) => new RegExp(d.$schemaRegEx).test($schema)) ?? drafts[drafts.length - 1];
}

export type Context = {
    /** root node of this json-schema */
    rootNode: SchemaNode;
    /** available draft configurations */
    drafts: Draft[];
    /** [SHARED ACROSS REMOTES] root nodes of registered remote json-schema, stored by id/url */
    remotes: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id + local-pointer */
    refs: Record<string, SchemaNode>;
    /** anchors stored by fully resolved schema-$id + $anchor */
    anchors: Record<string, SchemaNode>;
    /** [SHARED ACROSS REMOTES] dynamicAnchors stored by fully resolved schema-$id + $anchor */
    dynamicAnchors: Record<string, SchemaNode>;
    /** json-schema parser, validator, reducer and resolver for this json-schema (root-schema and its child nodes) */
    keywords: Draft["keywords"];
    /** json-schema draft-dependend methods */
    methods: Draft["methods"];
    /** draft-version */
    version: Draft["version"];
    errors: Draft["errors"];
    formats: Draft["formats"];
    /** [SHARED USING ADD REMOTE] getTemplate default options */
    templateDefaultOptions?: TemplateOptions;
};

export interface SchemaNode extends SchemaNodeMethodsType {
    context: Context;
    schema: JsonSchema;
    spointer: string;
    /** local path within json-schema (not extended by resolving ref) */
    schemaId: string;
    parent?: SchemaNode | undefined;
    /** json-pointer from last $id ~~to this location~~ to resolve $refs to $id#/idLocalPointer */
    lastIdPointer: string;
    oneOfIndex?: number;

    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: JsonSchemaValidator[];

    resolveRef?: (args?: { pointer?: string; path?: ValidationPath }) => SchemaNode;
    // parsed schema properties (registered by parsers)
    $defs?: Record<string, SchemaNode>;
    $id?: string;
    additionalItems?: SchemaNode;
    additionalProperties?: SchemaNode;
    allOf?: SchemaNode[];
    anyOf?: SchemaNode[];
    contains?: SchemaNode;
    dependencies?: Record<string, SchemaNode | boolean | string[]>;
    dependentSchemas?: Record<string, SchemaNode | boolean>;
    else?: SchemaNode;
    if?: SchemaNode;
    itemsList?: SchemaNode[];
    itemsObject?: SchemaNode;
    not?: SchemaNode;
    oneOf?: SchemaNode[];
    patternProperties?: { pattern: RegExp; node: SchemaNode }[];
    properties?: Record<string, SchemaNode>;
    propertyNames?: SchemaNode;
    ref?: string;
    then?: SchemaNode;
    unevaluatedItems?: SchemaNode;
    unevaluatedProperties?: SchemaNode;
}

type SchemaNodeMethodsType = typeof SchemaNodeMethods;

export type GetSchemaOptions = {
    /**
     *  Per default `undefined` is returned for valid data, but undefined schema.
     *
     * - Using `withSchemaWarning:true` will return an error instead: `{ type: "error", code: "schema-warning" }`
     */
    withSchemaWarning?: boolean;
    /**
     *  Per default `undefined` is returned for valid data, but undefined schema.
     *
     * - Using `createSchema:true` will create a schema instead
     */
    createSchema?: boolean;
    path?: ValidationPath;
    pointer?: string;
};

export const SchemaNodeMethods = {
    /** Compiles a child-schema of this node to its context */
    compileSchema(schema: JsonSchema, spointer: string = this.spointer, schemaId?: string): SchemaNode {
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
            ...SchemaNodeMethods
        };

        addKeywords(node);

        return node;
    },

    createError<T extends string = DefaultErrors>(name: T, data: ErrorData, message?: string): JsonError {
        let errorMessage = message;
        if (errorMessage === undefined) {
            const error = this.context.errors[name];
            if (typeof error === "function") {
                return error(data);
            }
            errorMessage = render(error ?? name, data);
        }
        return { type: "error", name, code: dashCase(name), message: errorMessage, data };
    },

    createSchema,

    eachSchema(callback: EachSchemaCallback) {
        const node = this as SchemaNode;
        return eachSchema(node, callback);
    },

    getChildSchemaSelection(property: string | number): JsonError | SchemaNode[] {
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
    getSchema(pointer: string, data?: unknown, options: GetSchemaOptions = {}): OptionalNodeAndError {
        options.path = options.path ?? [];

        options.withSchemaWarning = options.withSchemaWarning ?? false;
        options.pointer = options.pointer ?? "#";

        const node = this as SchemaNode;
        const keys = split(pointer);
        if (keys.length === 0) {
            const result = node.resolveRef(options);
            return isJsonError(result) ? { node: undefined, error: result } : { node: result, error: undefined };
        }
        let currentPointer = "#";
        let currentNode = node;
        for (let i = 0, l = keys.length; i < l; i += 1) {
            currentPointer = `${currentPointer}/${keys[i]}`;
            const result = currentNode.getChild(keys[i], data, { ...options, pointer: currentPointer });
            if (result.error) {
                return result;
            }
            if (result.node == null) {
                return result;
            }
            currentNode = result.node;
            data = getValue(data, keys[i]);
        }
        const result = currentNode.resolveRef(options);
        return isJsonError(result) ? { node: undefined, error: result } : { node: result, error: undefined };
    },

    getRef($ref: string): SchemaNode | undefined {
        const node = this as SchemaNode;
        return node.compileSchema({ $ref }).resolveRef();
    },

    getChild(key: string | number, data?: unknown, options: GetSchemaOptions = {}): OptionalNodeAndError {
        options.path = options.path ?? [];

        options.withSchemaWarning = options.withSchemaWarning ?? false;
        options.pointer = options.pointer ?? "#";
        const { path, pointer } = options;

        let node = this as SchemaNode;
        if (node.reducers.length) {
            const result = node.reduce(data, { key, path, pointer });
            if (result.error) {
                return result;
            }
            if (isSchemaNode(result.node)) {
                node = result.node;
            }
        }

        for (const resolver of node.resolvers) {
            const schemaNode = resolver({ data, key, node });
            if (isSchemaNode(schemaNode)) {
                return { node: schemaNode, error: undefined };
            }
            if (isJsonError(schemaNode)) {
                return { node: undefined, error: schemaNode };
            }
        }

        const referencedNode = node.resolveRef({ path });
        if (referencedNode !== node) {
            return referencedNode.getChild(key, data, options);
        }

        if (options.createSchema === true) {
            const newNode = node.compileSchema(
                createSchema(getValue(data, key)),
                `${node.spointer}/additional`,
                `${node.schemaId}/additional`
            );
            return { node: newNode, error: undefined };
        }

        if (options.withSchemaWarning === true) {
            const error = node.createError("SchemaWarning", { pointer, value: data, schema: node.schema, key });
            return { node: undefined, error };
        }

        return { node: undefined, error: undefined };
    },

    getDraftVersion() {
        return (this as SchemaNode).context.version;
    },

    /** Creates data that is valid to the schema of this node */
    getTemplate(data?: unknown, options?: TemplateOptions) {
        const node = this as SchemaNode;
        const opts = {
            recursionLimit: 1,
            ...node.context.templateDefaultOptions,
            cache: {},
            ...(options ?? {})
        };
        return node.context.methods.getTemplate(node, data, opts);
    },

    reduce(
        data: unknown,
        options: { key?: string | number; pointer?: string; path?: ValidationPath } = {}
    ): OptionalNodeAndError {
        const { key, pointer, path } = options;
        const resolvedNode = { ...this.resolveRef({ pointer, path }) } as SchemaNode;
        // const resolvedSchema = mergeSchema(this.schema, resolvedNode?.schema);
        // const node = (this as SchemaNode).compileSchema(resolvedSchema, this.spointer, resolvedSchema.schemaId);
        const node = mergeNode(this, resolvedNode, "$ref");
        // const node = resolvedNode;

        // @ts-expect-error bool schema
        if (node.schema === false) {
            return { node, error: undefined };
            // @ts-expect-error bool schema
        } else if (node.schema === true) {
            const nextNode = node.compileSchema(createSchema(data), node.spointer, node.schemaId);
            path?.push({ pointer, node });
            return { node: nextNode, error: undefined };
        }

        let schema;
        let workingNode = node;
        const reducers = node.reducers;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, key, node, pointer });
            if (isJsonError(result)) {
                return { node: undefined, error: result };
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
            return { node: { ...node, schema: false, reducers: [] } as SchemaNode, error: undefined };
        }

        if (workingNode !== node) {
            path?.push({ pointer, node });
        }

        // remove dynamic properties of node
        workingNode.schema = omit(workingNode.schema, ...DYNAMIC_PROPERTIES);
        // @ts-expect-error string accessing schema props
        DYNAMIC_PROPERTIES.forEach((prop) => (workingNode[prop] = undefined));
        return { node: workingNode, error: undefined };
    },

    /** Creates a new node with all dynamic schema properties merged according to the passed in data */
    validate(data: unknown, pointer = "#", path: ValidationPath = []): { valid: boolean; errors: JsonError[] } {
        const errors = validateNode(this, data, pointer, path) ?? [];
        const flatErrorList = sanitizeErrors(Array.isArray(errors) ? errors : [errors]).filter(isJsonError);
        return {
            valid: flatErrorList.length === 0,
            errors: flatErrorList
        };
    },

    async validateAsync(
        data: unknown,
        pointer = "#",
        path: ValidationPath = []
    ): Promise<{ valid: boolean; errors: JsonError[] }> {
        const errors = validateNode(this, data, pointer, path) ?? [];
        let resolvedErrors = await Promise.all(sanitizeErrors(Array.isArray(errors) ? errors : [errors]));
        resolvedErrors = sanitizeErrors(resolvedErrors) as JsonError[];
        return {
            valid: resolvedErrors.length === 0,
            errors: resolvedErrors
        };
    },

    /**
     * Register a json-schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    addRemote(url: string, schema: JsonSchema): SchemaNode {
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
            context: {
                ...context,
                refs: {},
                anchors: {},
                ...copy(pick(draft, "methods", "keywords", "version", "formats", "errors"))
            },
            ...SchemaNodeMethods
        } as SchemaNode;

        node.context.rootNode = node;
        node.context.remotes[joinId(url)] = node;
        addKeywords(node);

        return this;
    },

    toDataNodes(data: unknown, pointer?: string) {
        const node = this as SchemaNode;
        return node.context.methods.toDataNodes(node, data, pointer);
    },

    toJSON() {
        return { ...this, context: undefined, errors: undefined, parent: this.parent?.spointer };
    }
} as const;

const whitelist = ["$ref", "if", "$defs"];
const noRefMergeDrafts = ["draft-04", "draft-06", "draft-07"];

export function addKeywords(node: SchemaNode) {
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

export function execKeyword(keyword: Keyword, node: SchemaNode) {
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
