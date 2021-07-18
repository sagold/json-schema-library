import getTypeOf from "./getTypeOf";
import createSchemaOf from "./createSchemaOf";
import errors from "./validation/errors";
import merge from "./utils/merge";
import { JSONSchema, JSONPointer, JSONError } from "./types";
import Core from "./cores/CoreInterface";


const stepType = {

    array: (core: Core, key: string|number, schema: JSONSchema, data: any, pointer: JSONPointer): JSONSchema|JSONError => {
        const itemsType = getTypeOf(schema.items);

        if (itemsType === "object") {
            // oneOf
            if (Array.isArray(schema.items.oneOf)) {
                return core.resolveOneOf(data[key], schema.items, pointer);
            }

            // anyOf
            if (Array.isArray(schema.items.anyOf)) {
                // schema of current object
                return core.resolveAnyOf(data[key], schema.items, pointer);
            }

            // allOf
            if (Array.isArray(schema.items.allOf)) {
                return core.resolveAllOf(data[key], schema.items, pointer);
            }

            // spec: ignore additionalItems, when items is schema-object
            return core.resolveRef(schema.items);
        }

        if (itemsType === "array") {
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === true) {
                return createSchemaOf(data[key]);
            }
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === false) {
                return errors.invalidDataError({ key, value: data[key], pointer });
            }

            if (schema.items[key]) {
                return core.resolveRef(schema.items[key]);
            }

            if (schema.additionalItems === false) {
                return errors.additionalItemsError({ key, value: data[key], pointer });
            }

            if (schema.additionalItems === true || schema.additionalItems === undefined) {
                return createSchemaOf(data[key]);
            }

            if (getTypeOf(schema.additionalItems) === "object") {
                return schema.additionalItems;
            }

            throw new Error(`Invalid schema ${JSON.stringify(schema, null, 4)} for ${JSON.stringify(data, null, 4)}`);
        }

        if (schema.additionalItems !== false && data[key]) {
            // @todo reevaluate: incomplete schema is created here
            // @todo support additionalItems: {schema}
            return createSchemaOf(data[key]);
        }

        return new Error(`Invalid array schema for ${key} at ${pointer}`) as JSONError;
    },

    object: (core: Core, key: string|number, schema: JSONSchema, data: any, pointer: JSONPointer): JSONSchema|JSONError => {

        if (Array.isArray(schema.oneOf)) {
            // update current schema
            const oneOfSchema = core.resolveOneOf(data, schema, pointer);
            // resolveOneOf does currently not apply merge with base schema
            schema = merge(schema, oneOfSchema);
            if (schema && schema.type === "error") {
                return schema;
            }
        }

        if (Array.isArray(schema.anyOf)) {
            // update current schema
            schema = core.resolveAnyOf(data, schema, pointer);
            if (schema && schema.type === "error") {
                return schema;
            }
        }

        if (Array.isArray(schema.allOf)) {
            // update current schema
            schema = core.resolveAllOf(data, schema, pointer);
            if (schema && schema.type === "error") {
                return schema;
            }
        }

        let targetSchema;

        // step into object-properties
        if (schema.properties && schema.properties[key] !== undefined) {
            // @todo patternProperties also validate properties

            targetSchema = core.resolveRef(schema.properties[key]);
            if (targetSchema && targetSchema.type === "error") {
                return targetSchema;
            }

            // check if there is a oneOf selection, which must be resolved
            if (targetSchema && Array.isArray(targetSchema.oneOf)) {
                // @special case: this is a mix of a schema and optional definitions
                // we resolve the schema here and add the original schema to `oneOfSchema`
                let resolvedSchema = core.resolveOneOf(data[key], targetSchema, `${pointer}/${key}`);
                resolvedSchema = JSON.parse(JSON.stringify(resolvedSchema));
                resolvedSchema.variableSchema = true;
                resolvedSchema.oneOfSchema = targetSchema;
                return resolvedSchema;
            }

            // resolved schema or error
            if (targetSchema) {
                return targetSchema;
            }
        }

        // find matching property key
        if (getTypeOf(schema.patternProperties) === "object") {
            let regex;
            const patterns = Object.keys(schema.patternProperties);
            for (let i = 0, l = patterns.length; i < l; i += 1) {
                regex = new RegExp(patterns[i]);
                if (regex.test(key)) {
                    return schema.patternProperties[patterns[i]];
                }
            }
        }

        if (getTypeOf(schema.additionalProperties) === "object") {
            return schema.additionalProperties;
        }

        if (schema.additionalProperties === true) {
            return createSchemaOf(data);
        }

        return errors.unknownPropertyError({ property: key, value: data, pointer });
    }
};


/**
 * Returns the json-schema of the given object property or array item.
 * e.g. it steps by one key into the data
 *
 *  This helper determines the location of the property within the schema (additional properties, oneOf, ...) and
 *  returns the correct schema.
 *
 * @param  core     - validator
 * @param  key      - property-name or array-index
 * @param  schema          - json schema of current data
 * @param  data      - parent of key
 * @param  [pointer]
 * @return Schema or Error if failed resolving key
 */
export default function step(core: Core, key: string|number, schema: JSONSchema, data?: any, pointer: JSONPointer = "#"):
JSONSchema|JSONError {
    const expectedType = schema.type || getTypeOf(data);
    if (stepType[expectedType]) {
        return stepType[expectedType](core, key, schema, data, pointer);
    }
    return new Error(`Unsupported schema type ${schema.type} for key ${key}`) as JSONError;
}
