import { Draft as Core } from "./draft";
export declare type JSONSchema = {
    [p: string]: any;
};
export declare type JSONPointer = string;
export declare type JSONError = {
    type: "error";
    name: string;
    code: string;
    message: string;
    data?: {
        [p: string]: any;
    };
    [p: string]: any;
};
/**
 * ts type guard for json error
 * @returns true if passed type is a JSONError
 */
export declare function isJSONError(error: any): error is JSONError;
export interface JSONValidator {
    (core: Core, schema: JSONSchema, value: unknown, pointer: JSONPointer): void | undefined | JSONError | JSONError[] | JSONError[][];
}
export interface JSONTypeValidator {
    (core: Core, schema: JSONSchema, value: unknown, pointer: JSONPointer): Array<void | undefined | JSONError | JSONError[] | JSONError[][]>;
}
