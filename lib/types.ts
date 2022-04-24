import Core from "./cores/CoreInterface";


export type JSONSchema = { [p:string]: any };

export type JSONPointer = string;

export type JSONError = {
    type: "error"|"string";
    name: string;
    code: string;
    message: string;
    data?: { [p: string]: any };
    [p: string]: any;
}

export interface JSONValidator {
    (core: Core, schema: JSONSchema, value: any, pointer: JSONPointer): void|undefined|JSONError|JSONError[];
}

export interface JSONTypeValidator {
    (core: Core, schema: JSONSchema, value: any, pointer: JSONPointer): Array<void|undefined|JSONError|JSONError[]>;
}
