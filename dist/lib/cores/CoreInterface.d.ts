import { JSONSchema, JSONPointer, JSONValidator, JSONTypeValidator, JSONError } from "../types";
import { CreateError } from "../utils/createCustomError";
export default class CoreInterface {
    /** entry point of schema */
    __rootSchema: JSONSchema;
    /** error creators by id */
    errors: Record<string, CreateError>;
    /** map for valid keywords of a type  */
    typeKeywords: Record<string, string[]>;
    /** keyword validators  */
    validateKeyword: Record<string, JSONValidator>;
    /** type validators  */
    validateType: Record<string, JSONTypeValidator>;
    /** format validators  */
    validateFormat: Record<string, JSONValidator>;
    constructor(schema?: JSONSchema);
    get rootSchema(): JSONSchema;
    set rootSchema(rootSchema: JSONSchema);
    each(data: any, callback: any, schema?: JSONSchema, pointer?: JSONPointer): void;
    validate(data: unknown, schema?: JSONSchema, pointer?: JSONPointer): Array<JSONError>;
    isValid(data: any, schema?: JSONSchema, pointer?: JSONPointer): boolean;
    resolveAnyOf(data: any, schema: JSONSchema, pointer?: JSONPointer): JSONSchema;
    resolveAllOf(data: any, schema: JSONSchema, pointer?: JSONPointer): JSONSchema;
    resolveRef(schema: JSONSchema): JSONSchema;
    resolveOneOf(data: any, schema: JSONSchema, pointer?: JSONPointer): JSONSchema;
    getSchema(pointer: JSONPointer, data: any, schema?: JSONSchema): void;
    getTemplate(data?: unknown, schema?: JSONSchema): void;
    setSchema(schema: JSONSchema): void;
    /**
     * Returns the json-schema of the given object property or array item.
     * e.g. it steps by one key into the data
     * This helper determines the location of the property within the schema
     * (additional properties, oneOf, ...) and returns the correct schema.
     *
     * @param key    property-name or array-index
     * @param schema json schema of current data
     * @param data   parent object or array of key
     * @param [pointer] json pointer of parent object or array
     * @return schema or error if failed resolving key
     */
    step(key: string | number, schema: JSONSchema, data: any, pointer?: JSONPointer): JSONSchema;
}
