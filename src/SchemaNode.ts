import copy from "fast-copy";
import sanitizeErrors from "./utils/sanitizeErrors";
import settings from "./settings";
import type {
    JsonSchemaReducer,
    JsonSchemaResolver,
    JsonSchemaValidator,
    Keyword,
    ValidationPath,
    ValidationResult
} from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { Draft } from "./Draft";
import { toSchemaNodes } from "./methods/toSchemaNodes";
import { isJsonError, JsonSchema, JsonError, ErrorData, DefaultErrors, OptionalNodeOrError } from "./types";
import { isObject } from "./utils/isObject";
import { join } from "@sagold/json-pointer";
import { joinId } from "./utils/joinId";
import { mergeNode } from "./mergeNode";
import { omit } from "./utils/omit";
import { pick } from "./utils/pick";
import { render } from "./errors/render";
import { TemplateOptions } from "./methods/getData";
import { validateNode } from "./validateNode";
import { hasProperty } from "./utils/hasProperty";
import { getNode } from "./getNode";
import { getNodeChild } from "./getNodeChild";

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
    /** root node of this JSON Schema */
    rootNode: SchemaNode;
    /** available draft configurations */
    drafts: Draft[];
    /** [SHARED ACROSS REMOTES] root nodes of registered remote JSON Schema, stored by id/url */
    remotes: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id + local-pointer */
    refs: Record<string, SchemaNode>;
    /** anchors stored by fully resolved schema-$id + $anchor */
    anchors: Record<string, SchemaNode>;
    /** [SHARED ACROSS REMOTES] dynamicAnchors stored by fully resolved schema-$id + $anchor */
    dynamicAnchors: Record<string, SchemaNode>;
    /** JSON Schema parser, validator, reducer and resolver for this JSON Schema (root schema and its child nodes) */
    keywords: Draft["keywords"];
    /** JSON Schema draft dependend methods */
    methods: Draft["methods"];
    /** draft version */
    version: Draft["version"];
    /** draft errors & template-strings */
    errors: Draft["errors"];
    /** draft formats & validators */
    formats: Draft["formats"];
    /** [SHARED USING ADD REMOTE] getData default options */
    getDataDefaultOptions?: TemplateOptions;
};

export interface SchemaNode extends SchemaNodeMethodsType {
    /** shared context across nodes of JSON schema and shared properties across all remotes */
    context: Context;
    /** JSON Schema of node */
    schema: JsonSchema;
    /** absolute path into JSON Schema, includes $ref for resolved schema */
    spointer: string;
    /** local path within JSON Schema (not extended by resolving ref) */
    schemaId: string;
    /** id created when combining subschemas */
    dynamicId: string;
    /** reference to parent node (node used to compile this node) */
    parent?: SchemaNode | undefined;
    /** JSON Pointer from last $id ~~to this location~~ to resolve $refs to $id#/idLocalPointer */
    lastIdPointer: string;
    /** when reduced schema containing `oneOf` schema, `oneOfIndex` stores `oneOf`-item used for merge */
    oneOfIndex?: number;

    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: JsonSchemaValidator[];

    resolveRef?: (args?: { pointer?: string; path?: ValidationPath }) => SchemaNode;
    // parsed schema properties (registered by parsers)
    $id?: string;
    $defs?: Record<string, SchemaNode>;
    $ref?: string;
    /** only used for draft <= 2019-09 */
    additionalItems?: SchemaNode;
    additionalProperties?: SchemaNode;
    allOf?: SchemaNode[];
    anyOf?: SchemaNode[];
    contains?: SchemaNode;
    dependentRequired?: Record<string, string[]>;
    dependentSchemas?: Record<string, SchemaNode | boolean>;
    else?: SchemaNode;
    if?: SchemaNode;
    prefixItems?: SchemaNode[];
    items?: SchemaNode;
    not?: SchemaNode;
    oneOf?: SchemaNode[];
    patternProperties?: { name: string; pattern: RegExp; node: SchemaNode }[];
    properties?: Record<string, SchemaNode>;
    propertyNames?: SchemaNode;
    then?: SchemaNode;
    unevaluatedItems?: SchemaNode;
    unevaluatedProperties?: SchemaNode;
}

type SchemaNodeMethodsType = typeof SchemaNodeMethods;

export type GetNodeOptions = {
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

export function joinDynamicId(a?: string, b?: string) {
    if (a == b) {
        return a ?? "";
    }
    if (a == null || b == null) {
        return a || b;
    }
    if (a.startsWith(b)) {
        return a;
    }
    if (b.startsWith(a)) {
        return b;
    }
    return `${a}+${b}`;
}

export const SchemaNodeMethods = {
    /**
     * Compiles a child-schema of this node to its context
     * @returns SchemaNode representing the passed JSON Schema
     */
    compileSchema(
        schema: JsonSchema,
        spointer: string = this.spointer,
        schemaId?: string,
        dynamicId?: string
    ): SchemaNode {
        const nextFragment = spointer.split("/$ref")[0];
        const parentNode = this as SchemaNode;
        const node: SchemaNode = {
            lastIdPointer: parentNode.lastIdPointer, // ref helper
            context: parentNode.context,
            parent: parentNode,
            spointer,
            dynamicId: joinDynamicId(parentNode.dynamicId, dynamicId),
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

    createError<T extends string = DefaultErrors>(code: T, data: ErrorData, message?: string): JsonError {
        let errorMessage = message;
        if (errorMessage === undefined) {
            const error = this.context.errors[code];
            if (typeof error === "function") {
                return error(data);
            }
            errorMessage = render(error ?? name, data);
        }
        return { type: "error", code, message: errorMessage, data };
    },

    createSchema,

    getChildSelection(property: string | number): JsonError | SchemaNode[] {
        const node = this as SchemaNode;
        return node.context.methods.getChildSelection(node, property);
    },

    getNode,
    getNodeChild,

    /**
     * @returns for $ref, the corresponding SchemaNode or undefined
     */
    getNodeRef($ref: string): SchemaNode | undefined {
        const node = this as SchemaNode;
        return node.compileSchema({ $ref }).resolveRef();
    },

    getNodeRoot() {
        const node = this as SchemaNode;
        return node.context.rootNode;
    },

    /**
     * @returns draft version this JSON Schema is evaluated by
     */
    getDraftVersion() {
        return (this as SchemaNode).context.version;
    },

    /**
     * @returns data that is valid to the schema of this node
     */
    getData(data?: unknown, options?: TemplateOptions) {
        const node = this as SchemaNode;
        const opts = {
            recursionLimit: 1,
            ...node.context.getDataDefaultOptions,
            cache: {},
            ...(options ?? {})
        };
        return node.context.methods.getData(node, data, opts);
    },

    /**
     * @returns SchemaNode with a reduced JSON Schema matching the given data
     */
    reduceNode(
        data: unknown,
        options: { key?: string | number; pointer?: string; path?: ValidationPath } = {}
    ): OptionalNodeOrError {
        const node = this as SchemaNode;
        const { key, pointer, path } = options;

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
        // we need to copy node to prevent modification of source
        // @todo does mergeNode break immutability?
        let workingNode = node.compileSchema(node.schema, node.spointer, node.schemaId);
        const reducers = node.reducers;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, key, node, pointer, path });
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

    /**
     * @returns validation result of data validated by this node's JSON Schema
     */
    validate(data: unknown, pointer = "#", path: ValidationPath = []) {
        const errors = validateNode(this, data, pointer, path) ?? [];
        const syncErrors: JsonError[] = [];
        const flatErrorList = sanitizeErrors(Array.isArray(errors) ? errors : [errors]).filter(isJsonError);

        const errorsAsync: Promise<JsonError | undefined>[] = [];
        sanitizeErrors(Array.isArray(errors) ? errors : [errors]).forEach((error) => {
            if (isJsonError(error)) {
                syncErrors.push(error);
            } else if (error instanceof Promise) {
                errorsAsync.push(error);
            }
        });

        const result: { valid: boolean; errors: JsonError[]; errorsAsync: Promise<JsonError | undefined>[] } = {
            valid: flatErrorList.length === 0,
            errors: syncErrors,
            errorsAsync
        };

        return result;
    },

    /**
     * Register a JSON Schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    addRemoteSchema(url: string, schema: JsonSchema): SchemaNode {
        // @draft >= 6
        schema.$id = joinId(schema.$id || url);
        const { context } = this as SchemaNode;
        const draft = getDraft(context.drafts, schema?.$schema ?? this.context.rootNode.$schema);

        const node: SchemaNode = {
            spointer: "#",
            lastIdPointer: "#",
            schemaId: "#",
            dynamicId: "",
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

    /**
     * @returns a list of all sub-schema as SchemaNode
     */
    toSchemaNodes() {
        return toSchemaNodes(this as SchemaNode);
    },

    /**
     * @returns a list of values (including objects and arrays) and their corresponding JSON Schema as SchemaNode
     */
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
