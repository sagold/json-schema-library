const getTypeOf = require("./getTypeOf");
const createSchemaOf = require("./createSchemaOf");
const errors = require("./validation/errors");
const merge = require("./utils/merge");


const stepType = {

    array: (core, key, schema, data, pointer) => {
        const itemsType = getTypeOf(schema.items);

        if (itemsType === "object") {
            // oneOf
            if (Array.isArray(schema.items.oneOf)) {
                return core.resolveOneOf(schema.items, data[key], pointer) || false;
            }

            // anyOf
            if (Array.isArray(schema.items.anyOf)) {
                // schema of current object
                return core.resolveAnyOf(schema.items, data[key], pointer);
            }

            // allOf
            if (Array.isArray(schema.items.allOf)) {
                return core.resolveAllOf(schema.items, data[key], pointer);
            }

            // spec: ignore additionalItems, when items is schema-object
            return core.resolveRef(schema.items);
        }

        if (itemsType === "array") {
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

        return new Error(`Invalid array schema for ${key} at ${pointer}`);
    },

    object: (core, key, schema, data, pointer) => {

        if (Array.isArray(schema.oneOf)) {
            // update current schema
            const oneOfSchema = core.resolveOneOf(schema, data, pointer);
            // resolveOneOf does currently not apply merge with base schema
            schema = merge(schema, oneOfSchema);
            if (schema && schema.type === "error") {
                return schema;
            }
        }

        if (Array.isArray(schema.anyOf)) {
            // update current schema
            schema = core.resolveAnyOf(schema, data, pointer);
            if (schema && schema.type === "error") {
                return schema;
            }
        }

        if (Array.isArray(schema.allOf)) {
            // update current schema
            schema = core.resolveAllOf(schema, data, pointer);
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
            if (targetSchema.oneOf && Array.isArray(targetSchema.oneOf)) {
                // @special case: this is a mix of a schema and optional definitions
                // we resolve the schema here and add the original schema to `oneOfSchema`
                let resolvedSchema = core.resolveOneOf(targetSchema, data[key], `${pointer}/${key}`);
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
 * @param  {CoreInterface} core     - validator
 * @param  {String|Number} key      - property-name or array-index
 * @param  {Object} schema          - json schema of current data
 * @param  {Object|Array} data      - parent of key
 * @param  {String} pointer
 * @return {Object|Error} Schema or Error if failed resolving key
 */
function step(core, key, schema, data, pointer = "#") {
    const expectedType = schema.type || getTypeOf(data);
    if (stepType[expectedType]) {
        return stepType[expectedType](core, key, schema, data, pointer);
    }
    return new Error(`Unsupported schema type ${schema.type} for key ${key}`);
}


module.exports = step;
