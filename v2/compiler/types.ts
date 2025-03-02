import { Draft } from "../../lib/draft";
import { JsonError, JsonSchema } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";

export type JsonSchemaReducerParams = { data: unknown; node: SchemaNode; pointer?: string };
export type JsonSchemaReducer = (options: JsonSchemaReducerParams) => SchemaNode | JsonError | undefined;

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export type JsonSchemaResolver = (options: JsonSchemaResolverParams) => SchemaNode | JsonError | undefined;

export type JsonSchemaValidatorParams = { pointer?: string; data: unknown; node: SchemaNode };
export type JsonSchemaValidator = (options: JsonSchemaValidatorParams) => JsonError | JsonError[] | undefined;

export type JsonSchemaDefaultDataResolverParams = { pointer?: string; data: unknown; node: SchemaNode };
export type JsonSchemaDefaultDataResolver = (options: JsonSchemaDefaultDataResolverParams) => unknown;

export type CompiledSchema = {
    getSchema: () => JsonSchema | undefined;
    next: (key: string | number) => CompiledSchema | undefined;
    get: (key: string | number) => JsonSchema | JsonError | undefined;
};

export type Context = {
    rootNode: SchemaNode;
    remotes: Record<string, SchemaNode>;
    /** references stored by host + local-pointer */
    refs: Record<string, SchemaNode>;
    /** references stored by scope-id */
    ids: Record<string, SchemaNode>;
    anchors: Record<string, string>;
};

export function isSchemaNode(value: unknown): value is SchemaNode {
    return (
        isObject(value) &&
        Array.isArray(value?.reducers) &&
        Array.isArray(value?.validators) &&
        Array.isArray(value?.resolvers)
    );
}

export type SchemaNode = {
    context: Context;
    draft: Draft;
    parent?: SchemaNode | undefined;
    ref?: string;
    scope?: string;
    schema: JsonSchema;
    spointer: string;
    oneOfIndex?: number;
    resolveRef: () => JsonSchema;

    // methods
    addRemote: (url: string, schema: JsonSchema) => SchemaNode;
    compileSchema: (draft: Draft, schema: JsonSchema, spointer?: string) => SchemaNode;
    get: (key: string | number, data?: unknown) => SchemaNode | JsonError;
    getTemplate: (data?: unknown) => unknown;
    reduce: ({ data, pointer }: { data: unknown; pointer?: string }) => SchemaNode | JsonError;
    toJSON: () => unknown;
    validate: (data: unknown, pointer?: string) => JsonError[];

    // logic
    getDefaultData: JsonSchemaDefaultDataResolver[];
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: JsonSchemaValidator[];

    // parsed schema (should be registered by parsers...)
    additionalItems?: SchemaNode;
    additionalProperties?: SchemaNode;
    allOf?: SchemaNode[];
    anyOf?: SchemaNode[];
    contains?: SchemaNode;
    else?: SchemaNode;
    if?: SchemaNode;
    itemsList?: SchemaNode[];
    itemsObject?: SchemaNode;
    oneOf?: SchemaNode[];
    patternProperties?: { pattern: RegExp; node: SchemaNode }[];
    $defs?: Record<string, SchemaNode>;
    properties?: Record<string, SchemaNode>;
    then?: SchemaNode;
};
