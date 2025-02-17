import { Draft } from "../../draft";
import { JsonSchema } from "../../types";

export type JsonSchemaReducerParams = { data: unknown; node: SchemaNode };
export type JsonSchemaReducer = (options: JsonSchemaReducerParams) => SchemaNode | undefined;

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export type JsonSchemaResolver = (options: JsonSchemaResolverParams) => SchemaNode | undefined;

export type CompiledSchema = {
    getSchema: () => JsonSchema | undefined;
    next: (key: string | number) => CompiledSchema | undefined;
    get: (key: string | number) => JsonSchema | undefined;
};

export type SchemaNode = {
    draft: Draft;
    /** property name or index */
    spointer: string;
    schema: JsonSchema;
    compileSchema: (draft: Draft, schema: JsonSchema, pointer?: string) => SchemaNode;
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: any[];
    reduce: ({ data }: { data: unknown }) => SchemaNode | undefined;
    get: (key: string | number, data?: unknown) => SchemaNode;
    properties?: Record<string, SchemaNode>;
    if?: SchemaNode;
    then?: SchemaNode;
    else?: SchemaNode;
    allOf?: SchemaNode[];
    additionalProperties?: SchemaNode;
    toJSON: () => unknown;
};
