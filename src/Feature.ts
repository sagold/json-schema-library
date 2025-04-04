import type { TemplateOptions } from "./methods/getTemplate";
import type { SchemaNode, JsonError } from "./types";

export type ValidationPath = {
    pointer: string;
    node: SchemaNode;
}[];

export type JsonSchemaReducerParams = {
    data: unknown;
    /** optional key to used to resolve by property without having data */
    key?: string | number;
    node: SchemaNode;
    pointer?: string;
    path?: ValidationPath;
};
export interface JsonSchemaReducer {
    toJSON?: () => string;
    (options: JsonSchemaReducerParams): SchemaNode | JsonError | undefined;
}

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export interface JsonSchemaResolver {
    toJSON?: () => string;
    (options: JsonSchemaResolverParams): SchemaNode | JsonError | undefined;
}

export type ValidationResult = JsonError | Promise<JsonError>;

export type JsonSchemaValidatorParams = { pointer?: string; data: unknown; node: SchemaNode; path?: ValidationPath };
export interface JsonSchemaValidator {
    toJSON?: () => string;
    (options: JsonSchemaValidatorParams): undefined | JsonError | ValidationResult[];
}

export type JsonSchemaDefaultDataResolverParams = {
    pointer?: string;
    data?: unknown;
    node: SchemaNode;
    options?: TemplateOptions;
};
export interface JsonSchemaDefaultDataResolver {
    toJSON?: () => string;
    (options: JsonSchemaDefaultDataResolverParams): unknown;
}

export type Feature = {
    id: string;
    keyword: string;

    parse?: (node: SchemaNode) => void;

    addResolve?: (node: SchemaNode) => boolean;
    resolve?: JsonSchemaResolver;

    addValidate?: (node: SchemaNode) => boolean;
    validate?: JsonSchemaValidator;

    addReduce?: (node: SchemaNode) => boolean;
    reduce?: JsonSchemaReducer;
};
