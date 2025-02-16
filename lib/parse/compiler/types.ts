import { Draft } from "../../draft";
import { JsonSchema } from "../../types";

export type JsonSchemaReducerParams = { data: unknown; node: SchemaNode };
export type JsonSchemaReducer = (options: JsonSchemaReducerParams) => SchemaNode | undefined;

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export type JsonSchemaResolver = (options: JsonSchemaResolverParams) => SchemaNode | undefined;

export type SchemaNode = {
    draft: Draft;
    /** property name or index */
    key?: string;
    pattern?: RegExp;
    schema: JsonSchema;
    compileSchema: (draft: Draft, schema: JsonSchema) => SchemaNode;
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    reduce: ({ data }: { data: unknown }) => SchemaNode | undefined;
    compile: (data: unknown) => { get(key: string | number): JsonSchema | undefined };
    children?: SchemaNode[];
    if?: SchemaNode;
    then?: SchemaNode;
    else?: SchemaNode;
    allOf?: SchemaNode[];
    additionalProperties?: SchemaNode;
    toJSON: () => unknown;
};
