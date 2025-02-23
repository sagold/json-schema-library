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

type Context = {
    rootSchema: JsonSchema;
    ids: Record<string, string>;
    remotes: Record<string, JsonSchema>;
    anchors: Record<string, string>;
    scopes: Record<string, string>;
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
    compileSchema: (draft: Draft, schema: JsonSchema, spointer?: string, parentNode?: SchemaNode) => SchemaNode;
    context: Context;
    draft: Draft;
    get: (key: string | number, data?: unknown) => SchemaNode | JsonError;
    getTemplate: (data?: unknown) => unknown;
    parent?: SchemaNode | undefined;
    reduce: ({ data, pointer }: { data: unknown; pointer?: string }) => SchemaNode | JsonError | undefined;
    ref?: string;
    schema: JsonSchema;
    spointer: string;
    toJSON: () => unknown;
    validate: (data: unknown, pointer?: string) => JsonError[];
    oneOfIndex?: number;

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
    properties?: Record<string, SchemaNode>;
    then?: SchemaNode;
};
