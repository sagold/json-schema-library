import { Draft } from "../../draft";
import { JsonError, JsonSchema } from "../../types";
import { isObject } from "../../utils/isObject";

export type JsonSchemaReducerParams = { data: unknown; node: SchemaNode };
export type JsonSchemaReducer = (options: JsonSchemaReducerParams) => SchemaNode | undefined;

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export type JsonSchemaResolver = (options: JsonSchemaResolverParams) => SchemaNode | undefined;

export type JsonSchemaValidatorParams = { pointer?: string; data: unknown; node: SchemaNode };
export type JsonSchemaValidator = (options: JsonSchemaValidatorParams) => JsonError[];

export type JsonSchemaDefaultDataResolverParams = { pointer?: string; data: unknown; node: SchemaNode };
export type JsonSchemaDefaultDataResolver = (options: JsonSchemaDefaultDataResolverParams) => unknown;

export type CompiledSchema = {
    getSchema: () => JsonSchema | undefined;
    next: (key: string | number) => CompiledSchema | undefined;
    get: (key: string | number) => JsonSchema | undefined;
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
    draft: Draft;
    ref?: string;
    getRoot?: () => JsonSchema;
    parent?: SchemaNode;
    /** property name or index */
    context: Context;
    spointer: string;
    schema: JsonSchema;
    compileSchema: (draft: Draft, schema: JsonSchema, spointer?: string, parentNode?: SchemaNode) => SchemaNode;
    validate: (data: unknown, pointer?: string) => JsonError[];
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    getDefaultData: JsonSchemaDefaultDataResolver[];
    validators: any[];
    reduce: ({ data }: { data: unknown }) => SchemaNode | undefined;
    get: (key: string | number, data?: unknown) => SchemaNode;
    getTemplate: (data?: unknown) => unknown;
    properties?: Record<string, SchemaNode>;
    if?: SchemaNode;
    then?: SchemaNode;
    else?: SchemaNode;
    allOf?: SchemaNode[];
    additionalProperties?: SchemaNode;
    toJSON: () => unknown;
};
