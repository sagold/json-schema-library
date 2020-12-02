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
