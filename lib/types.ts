import { Draft as Core } from "./draft";

export type JSONSchema = { [p: string]: any };

export type JSONPointer = string;

export type JSONError = {
    type: "error";
    name: string;
    code: string;
    message: string;
    data?: { [p: string]: any };
    [p: string]: any;
};

/**
 * ts type guard for json error
 * @returns true if passed type is a JSONError
 */
export function isJSONError(error: any): error is JSONError {
    return error?.type === "error";
}

export interface JSONValidator {
    (core: Core, schema: JSONSchema, value: unknown, pointer: JSONPointer):
        | void
        | undefined
        | JSONError
        | JSONError[]
        | JSONError[][];
}

export interface JSONTypeValidator {
    (core: Core, schema: JSONSchema, value: unknown, pointer: JSONPointer): Array<
        void | undefined | JSONError | JSONError[] | JSONError[][]
    >;
}
