import { Draft } from "./draft";
export type JsonSchema = {
    [p: string]: any;
};
export type JsonPointer = string;
export type ErrorData<T extends Record<string, unknown> = {
    [p: string]: unknown;
}> = T & {
    pointer: string;
    schema: JsonSchema;
    value: unknown;
};
export type JsonError<T extends ErrorData = ErrorData> = {
    type: "error";
    name: string;
    code: string;
    message: string;
    data: T;
    [p: string]: unknown;
};
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export declare function isJsonError(error: any): error is JsonError;
export interface JsonValidator {
    (draft: Draft, schema: JsonSchema, value: unknown, pointer: JsonPointer): void | undefined | JsonError | JsonError[] | JsonError[][];
}
export interface JsonTypeValidator {
    (draft: Draft, schema: JsonSchema, value: unknown, pointer: JsonPointer): Array<void | undefined | JsonError | JsonError[] | JsonError[][]>;
}
