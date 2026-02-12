/* eslint-disable @typescript-eslint/no-explicit-any */
import { Draft } from "./Draft";
import { errors } from "./errors/errors";
import { SchemaNode, isSchemaNode, GetNodeOptions } from "./SchemaNode";
import { isObject } from "./utils/isObject";

export type BooleanSchema = boolean;
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface JsonSchema {
    [keyword: string]: any;
}

export type JsonPointer = string;

export type AnnotationData<D extends Record<string, unknown> = Record<string, unknown>> = D & {
    /* json-pointer to location of error */
    pointer: string;
    /* json-schema of error location */
    schema: JsonSchema;
    /* value: data in error location */
    value: unknown;
};

export type Annotation<T = string, D extends AnnotationData = AnnotationData, S = string> = {
    type: T;
    code: S;
    message: string;
    data: D;
    [p: string]: unknown;
};

export type DefaultErrors = keyof typeof errors;
export type ErrorConfig = Record<DefaultErrors | string, string | ((error: AnnotationData) => void)>;
export type OptionalNodeOrError = { node?: SchemaNode; error: undefined } | { node: undefined; error?: JsonError };
export type NodeOrError = { node: SchemaNode; error: undefined } | { node: undefined; error: JsonError };
export type JsonError<D extends AnnotationData = AnnotationData> = Annotation<"error", D, ErrorConfig | string>;
export type JsonAnnotation<D extends AnnotationData = AnnotationData> = Annotation<"annotation", D>;

export type { SchemaNode, GetNodeOptions, Draft };
export { isSchemaNode };

export function isAnnotation(value: any): value is Annotation {
    return isObject(value) && (value?.type && value?.code && value?.data) != null;
}

/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export function isJsonAnnotation(error: unknown): error is JsonAnnotation {
    return isObject(error) && error.type === "annotation";
}

/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export function isJsonError(error: unknown): error is JsonError {
    return isObject(error) && error.type === "error";
}

export function isNumber(value: unknown): value is number {
    return isNaN(value as number) === false;
}
