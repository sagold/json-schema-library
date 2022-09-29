/* eslint @typescript-eslint/no-unused-vars: "off" */
import resolveRef from "../resolveRef.withOverwrite";
import compileSchema from "../compileSchema";
import resolveAnyOf from "../resolveAnyOf";
import resolveAllOf from "../resolveAllOf";
import { JSONSchema, JSONPointer, JSONValidator, JSONTypeValidator, JSONError } from "../types";
import { CreateError } from "../utils/createCustomError";

/* eslint no-unused-vars: 0 no-empty-function: 0 */
export default class CoreInterface {
    /** entry point of schema */
    __rootSchema: JSONSchema;
    /** error creators by id */
    errors: Record<string, CreateError> = {};
    /** map for valid keywords of a type  */
    typeKeywords: Record<string, string[]> = {};
    /** keyword validators  */
    validateKeyword: Record<string, JSONValidator> = {};
    /** type validators  */
    validateType: Record<string, JSONTypeValidator> = {};
    /** format validators  */
    validateFormat: Record<string, JSONValidator> = {};

    constructor(schema?: JSONSchema) {
        this.setSchema(schema);
    }

    get rootSchema() {
        return this.__rootSchema;
    }

    set rootSchema(rootSchema: JSONSchema) {
        if (rootSchema == null) {
            return;
        }
        this.__rootSchema = compileSchema(rootSchema);
    }

    each(data: any, callback, schema: JSONSchema = this.rootSchema, pointer: JSONPointer = "#") {
        throw new Error("function 'each' is not implemented");
    }

    validate(
        data: unknown,
        schema: JSONSchema = this.rootSchema,
        pointer: JSONPointer = "#"
    ): Array<JSONError> {
        throw new Error("function 'validate' is not implemented");
    }

    isValid(data: any, schema: JSONSchema = this.rootSchema, pointer: JSONPointer = "#"): boolean {
        throw new Error("function 'isValid' is not implemented");
    }

    resolveAnyOf(data: any, schema: JSONSchema, pointer: JSONPointer = "#"): JSONSchema {
        return resolveAnyOf(this, data, schema, pointer);
    }

    resolveAllOf(data: any, schema: JSONSchema, pointer: JSONPointer = "#"): JSONSchema {
        return resolveAllOf(this, data, schema, pointer);
    }

    resolveRef(schema: JSONSchema): JSONSchema {
        throw new Error("function 'resolveRef' is not implemented");
    }

    resolveOneOf(data: any, schema: JSONSchema, pointer: JSONPointer = "#"): JSONSchema {
        throw new Error("function 'resolveOneOf' is not implemented");
    }

    getSchema(pointer: JSONPointer, data: any, schema: JSONSchema = this.rootSchema) {
        throw new Error("function 'getSchema' is not implemented");
    }

    getTemplate(data?: unknown, schema: JSONSchema = this.rootSchema) {
        throw new Error("function 'getTemplate' is not implemented");
    }

    setSchema(schema: JSONSchema) {
        this.rootSchema = schema;
    }

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
    step(
        key: string | number,
        schema: JSONSchema,
        data: any,
        pointer: JSONPointer = "#"
    ): JSONSchema {
        throw new Error("function 'step' is not implemented");
    }
}
